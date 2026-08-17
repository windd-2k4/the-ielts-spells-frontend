import {
  Archive, ArrowSquareOut, BookOpenText, Books, Check, FileAudio, FileText,
  MagnifyingGlass, NotePencil, Plus, SpinnerGap, Trash, WarningCircle,
} from "@phosphor-icons/react";
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import type { Course, Page } from "../../academic-types";
import type { ExerciseTemplate, LearningResource, LibraryItem, LibrarySkill, LibraryView } from "../../library-types";
import { isResource } from "../../library-types";
import { apiFetch } from "../../lib/api";
import LibraryItemModal from "./LibraryItemModal";
import ResourceFilesDialog from "./ResourceFilesDialog";
import { CATEGORIES, SKILLS, categoryLabel } from "./library-config";

type Props = { courseId?: string; compactHeader?: boolean };

const itemIcon = (item: LibraryItem) => {
  if (!isResource(item)) return <BookOpenText size={21} weight="duotone"/>;
  if (item.resourceType === "AUDIO") return <FileAudio size={21} weight="duotone"/>;
  if (item.resourceType === "TEACHER_NOTE") return <NotePencil size={21} weight="duotone"/>;
  return <FileText size={21} weight="duotone"/>;
};

export default function LibraryWorkspace({ courseId, compactHeader = false }: Props) {
  const [view, setView] = useState<LibraryView>("RESOURCES");
  const [skill, setSkill] = useState<LibrarySkill>("LISTENING");
  const [category, setCategory] = useState("ALL");
  const [scope, setScope] = useState(courseId ? "ALL" : "GLOBAL");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<LibraryItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [archiving, setArchiving] = useState<LibraryItem | null>(null);
  const [resourceFiles, setResourceFiles] = useState<LearningResource | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      // Library records use the content lifecycle DRAFT / PUBLISHED / ARCHIVED.
      // "ACTIVE" belongs to enrolment/staff workflows and would always return an empty list here.
      const params = new URLSearchParams({ size: "100", skill, status: "PUBLISHED" });
      if (deferredQuery.trim()) params.set("query", deferredQuery.trim());
      if (courseId) { params.set("courseId", courseId); params.set("includeGlobal", "true"); }
      else if (scope !== "ALL") params.set("scope", scope);
      const endpoint = view === "RESOURCES" ? "resources" : "exercises";
      const result = await apiFetch<Page<LearningResource | ExerciseTemplate>>(`/admin/library/${endpoint}?${params}`);
      setItems(result.content);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không tải được kho học liệu.");
    } finally { setLoading(false); }
  }, [courseId, deferredQuery, scope, skill, view]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (courseId) return;
    void apiFetch<Page<Course>>("/admin/courses?size=100").then(result=>setCourses(result.content)).catch(()=>setCourses([]));
  }, [courseId]);
  useEffect(() => { setCategory("ALL"); }, [skill]);

  const counts = useMemo(() => CATEGORIES[skill].map(value => ({ ...value, count: items.filter(item => item.category === value.value).length })), [items, skill]);
  const visibleItems = useMemo(
    () => category === "ALL" ? items : items.filter(item => item.category === category),
    [category, items],
  );

  async function archive() {
    if (!archiving) return;
    try {
      const endpoint = isResource(archiving) ? "resources" : "exercises";
      await apiFetch(`/admin/library/${endpoint}/${archiving.id}`, { method: "DELETE" });
      setArchiving(null); setNotice("Đã chuyển học liệu vào lưu trữ."); await load();
      window.setTimeout(()=>setNotice(""), 2800);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể lưu trữ học liệu."); }
  }

  async function handleSaved() {
    await load();
    setNotice("Đã lưu học liệu. Bạn có thể mở mục “Tệp & xem trước” để quản lý tệp đính kèm.");
    window.setTimeout(() => setNotice(""), 4000);
  }

  return <section className="space-y-5">
    {!compactHeader && <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-primary">Nội dung đào tạo</span><h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Kho học liệu</h1><p className="mt-2 max-w-3xl text-on-surface-variant">Quản lý tài liệu giảng dạy và bài tập mẫu dùng chung, sau đó gắn trực tiếp vào buổi học.</p></div><button onClick={()=>{setEditing(null);setModalOpen(true)}} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary"><Plus size={18} weight="bold"/>Thêm {view === "RESOURCES" ? "tài liệu" : "bài tập mẫu"}</button></header>}

    <div className="rounded-[22px] border border-outline-variant/40 bg-surface p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="inline-flex rounded-xl bg-surface-container p-1">
          <button onClick={()=>setView("RESOURCES")} className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-bold ${view === "RESOURCES" ? "bg-surface text-primary shadow-sm" : "text-on-surface-variant"}`}><Books size={18}/>Kho tài liệu</button>
          <button onClick={()=>setView("EXERCISES")} className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-bold ${view === "EXERCISES" ? "bg-surface text-primary shadow-sm" : "text-on-surface-variant"}`}><BookOpenText size={18}/>Kho bài tập mẫu</button>
        </div>
        {compactHeader && <button onClick={()=>{setEditing(null);setModalOpen(true)}} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-on-primary"><Plus size={17}/>Thêm mới</button>}
      </div>
      <nav aria-label="Kỹ năng" className="mt-4 grid gap-2 md:grid-cols-4">{SKILLS.map(value=><button key={value.id} onClick={()=>setSkill(value.id)} className={`rounded-xl border p-3 text-left transition ${skill === value.id ? "border-primary bg-primary-container/15" : "border-outline-variant/50 hover:border-primary/40"}`}><strong className={`block text-sm ${skill === value.id ? "text-primary" : ""}`}>{value.label}</strong><small className="mt-1 line-clamp-2 block leading-4 text-on-surface-variant">{value.note}</small></button>)}</nav>
    </div>

    <div className="grid gap-5 xl:grid-cols-[250px_1fr]">
      <aside className="rounded-[22px] border border-outline-variant/40 bg-surface p-3 xl:self-start"><p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Cấu trúc {skill}</p><button onClick={()=>setCategory("ALL")} className={`flex min-h-10 w-full items-center justify-between rounded-xl px-3 text-sm font-semibold ${category === "ALL" ? "bg-primary text-on-primary" : "hover:bg-surface-container"}`}><span>Tất cả</span><span>{items.length}</span></button>{counts.map(value=><button key={value.value} onClick={()=>setCategory(value.value)} className={`mt-1 flex min-h-10 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-semibold ${category === value.value ? "bg-primary text-on-primary" : "hover:bg-surface-container"}`}><span>{value.label}</span><span className="tabular-nums opacity-70">{value.count}</span></button>)}</aside>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-[22px] border border-outline-variant/40 bg-surface p-4 md:flex-row md:items-center"><label className="relative flex-1"><span className="sr-only">Tìm học liệu</span><MagnifyingGlass size={19} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline"/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Tìm theo tên, mã hoặc mô tả..." className="min-h-11 w-full rounded-xl border-outline-variant/60 bg-surface pl-11 text-sm focus:border-primary focus:ring-primary"/></label>{!courseId&&<select aria-label="Phạm vi" value={scope} onChange={event=>setScope(event.target.value)} className="min-h-11 rounded-xl border-outline-variant/60 bg-surface text-sm focus:border-primary focus:ring-primary"><option value="GLOBAL">Dùng chung</option><option value="COURSE">Theo khóa học</option><option value="ALL">Tất cả phạm vi</option></select>}</div>
        {notice&&<p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"><Check size={18}/>{notice}</p>}
        {error&&<div className="rounded-[22px] border border-error/30 bg-error-container/10 p-8 text-center"><WarningCircle size={30} className="mx-auto text-error"/><p className="mt-3 font-bold text-error">Không tải được dữ liệu</p><p className="mt-1 text-sm text-on-surface-variant">{error}</p><button onClick={()=>void load()} className="mt-4 rounded-xl border border-primary/40 px-4 py-2 text-sm font-bold text-primary">Thử lại</button></div>}
        {loading&&!error&&<div className="grid min-h-48 place-items-center rounded-[22px] border border-outline-variant/40 bg-surface"><span className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant"><SpinnerGap className="animate-spin"/>Đang tải kho học liệu...</span></div>}
        {!loading&&!error&&visibleItems.length===0&&<div className="rounded-[22px] border border-dashed border-outline-variant/70 bg-surface p-10 text-center"><Archive size={34} className="mx-auto text-outline"/><h2 className="mt-3 font-display text-xl font-bold">Chưa có học liệu trong nhóm này</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-on-surface-variant">Tạo mục đầu tiên hoặc đổi bộ lọc. Dữ liệu trống được giữ nguyên, hệ thống không tự sinh nội dung giả.</p><button onClick={()=>{setEditing(null);setModalOpen(true)}} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary"><Plus size={18}/>Thêm mới</button></div>}
        {!loading&&!error&&visibleItems.length>0&&<div className="grid gap-3 lg:grid-cols-2">{visibleItems.map(item=>{const externalUrl = isResource(item) ? item.externalUrl : item.sourceUrl; return <article key={item.id} className="group rounded-[22px] border border-outline-variant/45 bg-surface p-5 transition hover:border-primary/45"><div className="flex items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-container/20 text-primary">{itemIcon(item)}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold text-primary">{item.code}</span><span className="rounded-full bg-surface-container px-2 py-0.5 text-[11px] font-bold text-on-surface-variant">{categoryLabel(item.skill, item.category)}</span>{item.scope === "COURSE"&&<span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">Riêng khóa</span>}</div><h3 className="mt-2 line-clamp-2 font-display text-lg font-bold">{item.title}</h3><p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-on-surface-variant">{isResource(item) ? item.description || "Chưa có mô tả." : item.instructions || "Chưa có hướng dẫn."}</p></div></div><div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/30 pt-4"><div className="flex items-center gap-2">{isResource(item) && <button onClick={()=>setResourceFiles(item)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-outline-variant/60 px-3 text-xs font-bold text-primary"><FileText size={16}/>Tệp & xem trước</button>}{externalUrl && <a href={externalUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-outline-variant/60 px-3 text-xs font-bold text-primary"><ArrowSquareOut size={16}/>Mở Drive</a>}<span className="text-xs text-on-surface-variant">Cập nhật {new Date(item.updatedAt).toLocaleDateString("vi-VN")}</span></div><div className="flex gap-1"><button onClick={()=>{setEditing(item);setModalOpen(true)}} aria-label={`Sửa ${item.title}`} className="grid h-9 w-9 place-items-center rounded-lg text-primary hover:bg-primary-container/20"><NotePencil size={17}/></button><button onClick={()=>setArchiving(item)} aria-label={`Lưu trữ ${item.title}`} className="grid h-9 w-9 place-items-center rounded-lg text-error hover:bg-error-container/20"><Trash size={17}/></button></div></div></article>})}</div>}
      </div>
    </div>

    <LibraryItemModal open={modalOpen} view={view} skill={skill} item={editing} courseId={courseId} courses={courses} onClose={()=>setModalOpen(false)} onSaved={handleSaved}/>
    <ResourceFilesDialog resource={resourceFiles} onClose={()=>setResourceFiles(null)}/>
    {archiving&&<div className="fixed inset-0 z-50 grid place-items-center bg-on-background/45 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-[22px] bg-surface p-6 shadow-2xl"><span className="grid h-12 w-12 place-items-center rounded-xl bg-error-container/20 text-error"><Trash size={22}/></span><h2 className="mt-4 font-display text-xl font-bold">Lưu trữ học liệu?</h2><p className="mt-2 text-sm leading-6 text-on-surface-variant"><strong>{archiving.title}</strong> sẽ không còn xuất hiện khi chọn bài cho session. Dữ liệu được lưu trữ mềm, không xóa vĩnh viễn.</p><div className="mt-6 flex justify-end gap-3"><button onClick={()=>setArchiving(null)} className="min-h-11 rounded-xl border border-outline-variant/60 px-4 text-sm font-bold">Hủy</button><button onClick={()=>void archive()} className="min-h-11 rounded-xl bg-error px-4 text-sm font-bold text-white">Xác nhận lưu trữ</button></div></div></div>}
  </section>;
}
