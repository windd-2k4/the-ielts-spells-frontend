import {
  Archive, ArrowSquareOut, Article, BookOpenText, Books, Check, ClipboardText, FileAudio,
  DotsThreeVertical, FileDoc, FileText, FileVideo, Folder, FolderOpen, GraduationCap, GridFour,
  House, Link, List, MagnifyingGlass, NotePencil, Plus, TextT, Trash, UploadSimple, WarningCircle,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import type { Course, Page } from "../../academic-types";
import type { ContentLifecycleStatus, ExerciseTemplate, LearningResource, LearningResourceType, LibraryFolder, LibraryItem } from "../../library-types";
import { isResource } from "../../library-types";
import { apiFetch } from "../../lib/api";
import LibraryItemModal from "./LibraryItemModal";
import ResourceFilesDialog from "./ResourceFilesDialog";
import AttachLibraryModal from "./AttachLibraryModal";
import CreateLibraryFolderDialog from "./CreateLibraryFolderDialog";
import CloudUploadDialog from "./CloudUploadDialog";
import { RESOURCE_TYPE_LABELS } from "./library-config";

type Props = { courseId?: string; compactHeader?: boolean };

const resourceTypeMeta: Record<LearningResourceType, { label: string; icon: Icon; tone: string }> = {
  DOCUMENT: { label: RESOURCE_TYPE_LABELS.DOCUMENT, icon: FileText, tone: "bg-[#f7e7ec] text-[#8f4458]" },
  AUDIO: { label: RESOURCE_TYPE_LABELS.AUDIO, icon: FileAudio, tone: "bg-amber-50 text-amber-700" },
  VIDEO: { label: RESOURCE_TYPE_LABELS.VIDEO, icon: FileVideo, tone: "bg-violet-50 text-violet-700" },
  DRIVE_LINK: { label: RESOURCE_TYPE_LABELS.DRIVE_LINK, icon: Link, tone: "bg-sky-50 text-sky-700" },
  TEACHER_NOTE: { label: RESOURCE_TYPE_LABELS.TEACHER_NOTE, icon: Article, tone: "bg-emerald-50 text-emerald-700" },
  ANSWER_KEY: { label: RESOURCE_TYPE_LABELS.ANSWER_KEY, icon: ClipboardText, tone: "bg-orange-50 text-orange-700" },
  VOCABULARY: { label: RESOURCE_TYPE_LABELS.VOCABULARY, icon: TextT, tone: "bg-cyan-50 text-cyan-700" },
};

function itemMeta(item: LibraryItem) {
  if (!isResource(item)) return { label: "Bài tập mẫu", icon: BookOpenText, tone: "bg-indigo-50 text-indigo-700", source: item.sourceUrl ? "Liên kết bài tập" : "Nội dung bài tập" };
  const type = resourceTypeMeta[item.resourceType] ?? { label: "Tài liệu", icon: FileText, tone: "bg-[#f7e7ec] text-[#8f4458]" };
  return {
    ...type,
    source: item.externalUrl ? "Liên kết Drive / Web" : item.resourceType === "TEACHER_NOTE" ? "Nội dung biên soạn" : "File học liệu",
  };
}

function ItemTypeBadge({ item, compact = false }: { item: LibraryItem; compact?: boolean }) {
  const meta = itemMeta(item);
  const IconComponent = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg font-bold ${meta.tone} ${compact ? "px-2 py-1 text-[10px]" : "px-2.5 py-1.5 text-[11px]"}`}>
      <IconComponent size={compact ? 14 : 15} weight="duotone" aria-hidden="true" />
      {meta.label}
    </span>
  );
}

function ItemSourceBadge({ item }: { item: LibraryItem }) {
  const meta = itemMeta(item);
  const SourceIcon = isResource(item) && item.externalUrl ? Link : isResource(item) && item.resourceType === "TEACHER_NOTE" ? Article : FileDoc;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e3dce2] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#746A6E]">
      <SourceIcon size={14} weight="duotone" aria-hidden="true" />
      {meta.source}
    </span>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("vi-VN");
}

const statusBadge = (status: ContentLifecycleStatus) => {
  switch (status) {
    case "PUBLISHED":
      return <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-[#237653]">Xuất bản</span>;
    case "IN_REVIEW":
      return <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-[#8a6000]">Chờ duyệt</span>;
    case "DRAFT":
      return <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-[#746A6E]">Bản nháp</span>;
    case "ARCHIVED":
      return <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-[#b4232d]">Lưu trữ</span>;
  }
};

export default function LibraryWorkspace({ courseId, compactHeader = false }: Props) {
  const view = "RESOURCES" as const;
  const [selectedFolderId, setSelectedFolderId] = useState<"ALL" | "GLOBAL" | string>("ALL");
  const [viewMode, setViewMode] = useState<"GRID" | "LIST">("GRID");
  const [sourceFilter, setSourceFilter] = useState<"ALL" | "FILES" | "LINKS">("ALL");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [folders, setFolders] = useState<LibraryFolder[]>([]);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<LibraryItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [archiving, setArchiving] = useState<LibraryItem | null>(null);
  const [resourceFiles, setResourceFiles] = useState<LearningResource | null>(null);
  const [attachingItem, setAttachingItem] = useState<LibraryItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ size: "100" });
      if (deferredQuery.trim()) params.set("query", deferredQuery.trim());
      if (courseId) { params.set("courseId", courseId); params.set("includeGlobal", "true"); }
      else if (selectedFolderId === "GLOBAL") params.set("scope", "GLOBAL");
      else if (selectedFolderId !== "ALL") params.set("folderId", selectedFolderId);
      const endpoint = view === "RESOURCES" ? "resources" : "exercises";
      const result = await apiFetch<Page<LearningResource | ExerciseTemplate>>(`/admin/library/${endpoint}?${params}`);
      setItems(result.content);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không tải được kho học liệu.");
    } finally { setLoading(false); }
  }, [courseId, deferredQuery, selectedFolderId]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (courseId) return;
    void apiFetch<Page<Course>>("/admin/courses?size=100")
      .then(result => setCourses(result.content))
      .catch(() => setCourses([]));
    void apiFetch<LibraryFolder[]>("/admin/library/folders")
      .then(setFolders)
      .catch(() => setFolders([]));
  }, [courseId]);
  const sourceCounts = useMemo(() => ({
    all: items.filter(item => !isResource(item) || item.category !== "MEDIA").length,
    files: items.filter(item => isResource(item) && item.category !== "MEDIA" && !item.externalUrl).length,
    links: items.filter(item => isResource(item) && item.category !== "MEDIA" && Boolean(item.externalUrl)).length,
  }), [items]);
  const visibleItems = useMemo(() => items.filter(item => {
    if (isResource(item) && item.category === "MEDIA") return false;
    if (sourceFilter === "FILES") return isResource(item) && !item.externalUrl;
    if (sourceFilter === "LINKS") return isResource(item) && Boolean(item.externalUrl);
    return true;
  }), [items, sourceFilter]);

  async function archive() {
    if (!archiving) return;
    try {
      const endpoint = isResource(archiving) ? "resources" : "exercises";
      await apiFetch(`/admin/library/${endpoint}/${archiving.id}`, { method: "DELETE" });
      setArchiving(null); setNotice("Đã chuyển học liệu vào lưu trữ."); await load();
      window.setTimeout(() => setNotice(""), 2800);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể lưu trữ học liệu."); }
  }

  async function handleSaved() {
    await load();
    setNotice("Đã lưu học liệu thành công.");
    window.setTimeout(() => setNotice(""), 3500);
  }

  function handleFolderCreated(folder: LibraryFolder) {
    setFolders(current => [folder, ...current.filter(item => item.id !== folder.id)]);
    setSelectedFolderId(folder.id);
    setNotice(`Đã tạo thư mục “${folder.name}”.`);
    window.setTimeout(() => setNotice(""), 3500);
  }

  const courseFolders = folders.filter(folder => folder.courseId);
  const customFolders = folders.filter(folder => !folder.courseId);
  const activeFolder = folders.find(folder => folder.id === selectedFolderId);

  return (
    <section>
      <div className={compactHeader ? "space-y-3" : "grid gap-5 lg:grid-cols-[224px_minmax(0,1fr)]"}>
        {!compactHeader && (
          <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start" aria-label="Điều hướng kho học liệu">
            <details className="group relative">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-center gap-2 rounded-2xl bg-[#8f4458] px-4 text-sm font-bold text-white shadow-sm hover:bg-[#743447] [&::-webkit-details-marker]:hidden">
                <Plus size={19} weight="bold" /> Mới
              </summary>
              <div className="absolute left-0 right-0 top-14 z-30 rounded-2xl border border-[#e3dce2] bg-white p-2 shadow-xl">
                <button onClick={(event) => { event.currentTarget.closest("details")?.removeAttribute("open"); setUploadOpen(true); }} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-bold text-[#211A1D] hover:bg-[#f7e7ec]"><UploadSimple size={18} className="text-[#8f4458]" /> Tải tệp hoặc thêm link</button>
                <button onClick={(event) => { event.currentTarget.closest("details")?.removeAttribute("open"); setFolderDialogOpen(true); }} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-bold text-[#211A1D] hover:bg-[#f7e7ec]"><Folder size={18} className="text-[#8f4458]" /> Tạo thư mục</button>
              </div>
            </details>

            <nav className="space-y-1 rounded-2xl border border-[#e3dce2] bg-white p-2">
              <button onClick={() => setSelectedFolderId("ALL")} className={`flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-bold ${selectedFolderId === "ALL" ? "bg-[#f7e7ec] text-[#8f4458]" : "text-[#5f565a] hover:bg-[#faf8fb]"}`}><House size={18} weight={selectedFolderId === "ALL" ? "fill" : "regular"} /> Tất cả tài liệu</button>
              <button onClick={() => setSelectedFolderId("GLOBAL")} className={`flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-bold ${selectedFolderId === "GLOBAL" ? "bg-[#f7e7ec] text-[#8f4458]" : "text-[#5f565a] hover:bg-[#faf8fb]"}`}><Books size={18} /> Dùng chung</button>
            </nav>

            <div>
              <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8d8287]">Bộ lọc</p>
              <div className="space-y-1">
                {([
                  { id: "ALL", label: "Tất cả", icon: Books, count: sourceCounts.all },
                  { id: "FILES", label: "Tệp tải lên", icon: FileText, count: sourceCounts.files },
                  { id: "LINKS", label: "Liên kết", icon: Link, count: sourceCounts.links },
                ] as const).map(option => {
                  const FilterIcon = option.icon;
                  const selected = sourceFilter === option.id;
                  return (
                    <button key={option.id} onClick={() => setSourceFilter(option.id)} aria-pressed={selected} className={`flex min-h-9 w-full items-center gap-2 rounded-xl px-2.5 text-left text-xs ${selected ? "bg-[#f7e7ec] font-bold text-[#8f4458]" : "text-[#5f565a] hover:bg-white"}`}>
                      <FilterIcon size={16} weight={selected ? "fill" : "regular"} className="shrink-0" />
                      <span className="flex-1">{option.label}</span>
                      <span className="text-[10px] text-[#8d8287]">{option.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between px-2"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8d8287]">Khóa học</p><GraduationCap size={16} className="text-[#8f4458]" /></div>
              <div className="max-h-60 space-y-1 overflow-y-auto pr-1">
                {courseFolders.map(folder => <button key={folder.id} onClick={() => setSelectedFolderId(folder.id)} title={folder.name} className={`flex min-h-10 w-full items-center gap-2 rounded-xl px-2.5 text-left text-xs ${selectedFolderId === folder.id ? "bg-[#f7e7ec] font-bold text-[#8f4458]" : "text-[#5f565a] hover:bg-white"}`}><Folder size={17} weight={selectedFolderId === folder.id ? "fill" : "regular"} className="shrink-0" /><span className="min-w-0 flex-1 truncate">{folder.name}</span><span className="text-[10px] text-[#8d8287]">{folder.itemCount}</span></button>)}
                {courseFolders.length === 0 && <p className="px-2 py-2 text-[11px] leading-4 text-[#8d8287]">Chưa có thư mục khóa học.</p>}
              </div>
            </div>

            {customFolders.length > 0 && <div><p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8d8287]">Thư mục riêng</p><div className="space-y-1">{customFolders.map(folder => <button key={folder.id} onClick={() => setSelectedFolderId(folder.id)} className={`flex min-h-10 w-full items-center gap-2 rounded-xl px-2.5 text-left text-xs ${selectedFolderId === folder.id ? "bg-[#f7e7ec] font-bold text-[#8f4458]" : "text-[#5f565a] hover:bg-white"}`}><Folder size={17} weight={selectedFolderId === folder.id ? "fill" : "regular"} /><span className="min-w-0 flex-1 truncate">{folder.name}</span><span className="text-[10px] text-[#8d8287]">{folder.itemCount}</span></button>)}</div></div>}
          </aside>
        )}

        <main className="min-w-0 space-y-4">
          <div className="grid gap-3 md:grid-cols-[minmax(180px,auto)_minmax(260px,1fr)_auto] md:items-center">
            <div className="min-w-0">
              <h1 className="truncate font-display text-xl font-extrabold tracking-tight text-[#211A1D]">{activeFolder?.name || (selectedFolderId === "GLOBAL" ? "Tài liệu dùng chung" : "Kho học liệu")}</h1>
              {!compactHeader && <p className="mt-0.5 text-[11px] text-[#746A6E]">Lưu trữ, tìm kiếm và mở tài liệu của hệ thống.</p>}
            </div>
            <label className="relative min-w-0"><span className="sr-only">Tìm học liệu</span><MagnifyingGlass size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#746A6E]" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm trong kho học liệu..." className="min-h-10 w-full rounded-xl border border-[#e3dce2] bg-white pl-9 pr-3 text-xs outline-none focus:border-[#8f4458] focus:ring-2 focus:ring-[#f7e7ec]" /></label>
            <div className="flex items-center justify-end gap-2">
              {compactHeader && <button onClick={() => setUploadOpen(true)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#8f4458] px-4 text-xs font-bold text-white"><Plus size={16} weight="bold" /> Thêm tài liệu</button>}
              <div className="inline-flex rounded-xl border border-[#e3dce2] bg-white p-0.5" role="group" aria-label="Chế độ hiển thị">
                <button onClick={() => setViewMode("LIST")} aria-pressed={viewMode === "LIST"} className={`grid h-9 w-9 place-items-center rounded-lg ${viewMode === "LIST" ? "bg-[#8f4458] text-white" : "text-[#746A6E] hover:bg-[#f1eef4]"}`} title="Danh sách"><List size={17} /></button>
                <button onClick={() => setViewMode("GRID")} aria-pressed={viewMode === "GRID"} className={`grid h-9 w-9 place-items-center rounded-lg ${viewMode === "GRID" ? "bg-[#8f4458] text-white" : "text-[#746A6E] hover:bg-[#f1eef4]"}`} title="Dạng lưới"><GridFour size={17} /></button>
              </div>
            </div>
          </div>

          {!compactHeader && selectedFolderId === "ALL" && view === "RESOURCES" && (
            <div>
              <div className="mb-2 flex items-center justify-between"><h2 className="font-display text-sm font-bold text-[#211A1D]">Thư mục</h2><button onClick={() => setFolderDialogOpen(true)} className="text-[11px] font-bold text-[#8f4458] hover:underline">Tạo thư mục</button></div>
              {folders.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {folders.slice(0, 8).map(folder => <button key={folder.id} onClick={() => setSelectedFolderId(folder.id)} className="group flex min-h-16 items-center gap-3 rounded-2xl border border-[#e3dce2] bg-white px-3.5 text-left hover:border-[#8f4458]/45 hover:bg-[#fdfafb]"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f7e7ec] text-[#8f4458]"><FolderOpen size={20} weight="duotone" /></span><span className="min-w-0 flex-1"><strong className="block truncate text-xs text-[#211A1D]">{folder.name}</strong><span className="mt-0.5 block text-[10px] text-[#746A6E]">{folder.itemCount} mục{folder.courseName ? ` · ${folder.courseName}` : ""}</span></span><DotsThreeVertical size={16} className="text-[#9b9296]" /></button>)}
                </div>
              ) : (
                <button onClick={() => setFolderDialogOpen(true)} className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-[#d8cdd3] bg-white px-4 py-3 text-left hover:border-[#8f4458]/50 hover:bg-[#fdfafb]">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f7e7ec] text-[#8f4458]"><Folder size={19} weight="duotone" /></span>
                  <span><strong className="block text-xs text-[#211A1D]">Chưa có thư mục</strong><span className="text-[10px] text-[#746A6E]">Tạo thư mục để sắp xếp tài liệu theo khóa học hoặc chủ đề.</span></span>
                </button>
              )}
            </div>
          )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#eee8eb] pt-3 text-xs text-[#746A6E]" aria-live="polite">
        <p><strong className="font-display text-sm text-[#211A1D]">Tệp</strong>{!loading && !error && <span className="ml-2 text-[11px]">{visibleItems.length} mục</span>}</p>
        <p className="hidden sm:block">Cập nhật gần nhất</p>
      </div>

      {notice && (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-[#237653]">
          <Check size={18} />
          {notice}
        </p>
      )}

      {error && (
        <div className="rounded-[18px] border border-rose-200 bg-rose-50 p-6 text-center">
          <WarningCircle size={28} className="mx-auto text-[#b4232d]" />
          <p className="mt-2 text-sm font-bold text-[#b4232d]">Không tải được kho học liệu</p>
          <p className="mt-1 text-xs text-[#746A6E]">{error}</p>
        </div>
      )}

      {loading && !error && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" aria-label="Đang tải dữ liệu học liệu">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="animate-pulse rounded-2xl border border-[#e3dce2] bg-white p-4">
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-xl bg-[#f1eef4]" />
                <div className="flex-1 space-y-2"><span className="block h-2.5 w-20 rounded bg-[#f1eef4]" /><span className="block h-2 w-14 rounded bg-[#f1eef4]" /></div>
              </div>
              <span className="mt-4 block h-4 w-4/5 rounded bg-[#f1eef4]" />
              <span className="mt-2 block h-4 w-3/5 rounded bg-[#f1eef4]" />
              <span className="mt-4 block h-16 rounded-xl bg-[#faf8fb]" />
            </div>
          ))}
        </div>
      )}

      {!loading && !error && visibleItems.length === 0 && (
        <div className="rounded-[18px] border border-dashed border-[#e3dce2] bg-white p-10 text-center">
          <Archive size={36} className="mx-auto text-[#746A6E]" />
          <h3 className="mt-3 font-display text-lg font-bold text-[#211A1D]">Chưa có học liệu phù hợp</h3>
          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-[#746A6E]">
            Tải tệp, thêm liên kết mới hoặc chọn bộ lọc khác để xem thêm kết quả.
          </p>
          <button
            onClick={() => setUploadOpen(true)}
            className="mt-4 inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#8f4458] px-4 text-xs font-bold text-white hover:bg-[#743447]"
          >
            <Plus size={16} />
            Thêm mới ngay
          </button>
        </div>
      )}

      {/* ITEMS DISPLAY (GRID vs LIST) */}
      {!loading && !error && visibleItems.length > 0 && (
        <>
          {viewMode === "GRID" ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {visibleItems.map((item) => {
                const externalUrl = isResource(item) ? item.externalUrl : item.sourceUrl;
                const meta = itemMeta(item);
                const ItemIcon = meta.icon;
                const SourceIcon = externalUrl ? Link : isResource(item) && item.resourceType === "TEACHER_NOTE" ? Article : FileDoc;
                const prefersExternal = Boolean(externalUrl) && (!isResource(item) || !item.attachmentsCount);
                return (
                  <article
                    key={item.id}
                    className="flex h-full flex-col rounded-2xl border border-[#e3dce2] bg-white p-4 transition-colors hover:border-[#8f4458]/45 hover:shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${meta.tone}`} aria-label={`Loại: ${meta.label}`} title={meta.label}>
                        <ItemIcon size={21} weight="duotone" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-[11px] font-bold text-[#8f4458]">{item.code}</span>
                          {statusBadge(item.status)}
                        </div>
                        <p className="mt-1 truncate text-[10px] font-semibold text-[#746A6E]" title={`${meta.label} · ${meta.source}`}>
                          {meta.label} · {meta.source}
                        </p>
                      </div>
                    </div>

                    <h3 className="mt-3 line-clamp-2 min-h-10 font-display text-sm font-bold leading-5 text-[#211A1D]" title={item.title}>
                      {item.title}
                    </h3>

                    <div className="mt-2 flex items-center gap-2">
                      <ItemTypeBadge item={item} compact />
                      {item.scope === "COURSE" && (
                        <span className="rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-bold text-[#8a6000]">Riêng khóa</span>
                      )}
                    </div>

                    <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-[#746A6E]">
                      {isResource(item) ? item.description || "Chưa có mô tả." : item.instructions || "Chưa có hướng dẫn."}
                    </p>

                    <div className="mt-auto pt-4">
                      <div className="flex items-center justify-between gap-2 border-t border-[#e3dce2]/70 pt-3 text-[10px] text-[#746A6E]">
                        <span className="inline-flex min-w-0 items-center gap-1 truncate" title={meta.source}>
                          <SourceIcon size={13} weight="duotone" className="shrink-0" aria-hidden="true" />
                          <span className="truncate">{meta.source}</span>
                        </span>
                        <time className="shrink-0" dateTime={item.updatedAt}>{formatDate(item.updatedAt)}</time>
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        {prefersExternal ? (
                          <a
                            href={externalUrl ?? undefined}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#f7e7ec] px-3 text-xs font-bold text-[#743447] hover:bg-[#efd6de] focus:outline-none focus:ring-2 focus:ring-[#8f4458]/30"
                          >
                            <ArrowSquareOut size={16} />
                            <span className="truncate">Mở liên kết</span>
                          </a>
                        ) : isResource(item) ? (
                            <button
                              onClick={() => setResourceFiles(item)}
                              className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#f7e7ec] px-3 text-xs font-bold text-[#743447] hover:bg-[#efd6de] focus:outline-none focus:ring-2 focus:ring-[#8f4458]/30"
                              aria-label={`Quản lý tệp của ${item.title}`}
                            >
                              <FileText size={16} />
                              <span className="truncate">{item.attachmentsCount ? `${item.attachmentsCount} tệp` : "Thêm tệp"}</span>
                            </button>
                        ) : (
                          <button
                            onClick={() => { setEditing(item); setModalOpen(true); }}
                            className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#f7e7ec] px-3 text-xs font-bold text-[#743447] hover:bg-[#efd6de] focus:outline-none focus:ring-2 focus:ring-[#8f4458]/30"
                          >
                            <BookOpenText size={16} />
                            <span className="truncate">Xem nội dung</span>
                          </button>
                        )}

                        {externalUrl && !prefersExternal && (
                          <a
                            href={externalUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#e3dce2] text-[#8f4458] hover:bg-[#f7e7ec] focus:outline-none focus:ring-2 focus:ring-[#8f4458]/30"
                            title="Mở liên kết ngoài"
                            aria-label={`Mở liên kết của ${item.title}`}
                          >
                            <ArrowSquareOut size={17} />
                          </a>
                        )}

                        <details className="group relative shrink-0">
                          <summary
                            className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-xl border border-[#e3dce2] text-[#746A6E] hover:border-[#8f4458]/40 hover:bg-[#faf8fb] focus:outline-none focus:ring-2 focus:ring-[#8f4458]/30 [&::-webkit-details-marker]:hidden"
                            aria-label={`Thao tác khác cho ${item.title}`}
                            title="Thao tác khác"
                          >
                            <DotsThreeVertical size={19} weight="bold" />
                          </summary>
                          <div className="absolute bottom-12 right-0 z-20 w-48 overflow-hidden rounded-xl border border-[#e3dce2] bg-white p-1.5 shadow-lg">
                            <button
                              onClick={(event) => { event.currentTarget.closest("details")?.removeAttribute("open"); setAttachingItem(item); }}
                              className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-semibold text-[#237653] hover:bg-emerald-50"
                            >
                              <Plus size={17} /> Gắn vào buổi học
                            </button>
                            <button
                              onClick={(event) => { event.currentTarget.closest("details")?.removeAttribute("open"); setEditing(item); setModalOpen(true); }}
                              className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-semibold text-[#211A1D] hover:bg-[#f7e7ec]"
                            >
                              <NotePencil size={17} /> Chỉnh sửa
                            </button>
                            <button
                              onClick={(event) => { event.currentTarget.closest("details")?.removeAttribute("open"); setArchiving(item); }}
                              className="flex min-h-11 w-full items-center gap-2 rounded-lg border-t border-[#e3dce2] px-3 text-left text-xs font-semibold text-[#b4232d] hover:bg-rose-50"
                            >
                              <Trash size={17} /> Lưu trữ
                            </button>
                          </div>
                        </details>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            /* LIST VIEW TABLE */
            <div className="overflow-x-auto rounded-[18px] border border-[#e3dce2] bg-white">
              <table className="min-w-[900px] w-full border-collapse text-left text-xs">
                <caption className="sr-only">Danh sách học liệu</caption>
                <thead>
                  <tr className="bg-[#f1eef4] text-[#746A6E] font-bold uppercase tracking-wider text-[11px]">
                    <th className="p-3.5">Mã & Tên học liệu</th>
                    <th className="p-3.5">Loại nội dung</th>
                    <th className="p-3.5">Nguồn</th>
                    <th className="p-3.5">Phạm vi</th>
                    <th className="p-3.5">Cập nhật</th>
                    <th className="p-3.5">Trạng thái</th>
                    <th className="p-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3dce2]">
                  {visibleItems.map((item) => (
                    <tr key={item.id} className="hover:bg-[#f7f5f9]">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${itemMeta(item).tone}`}>
                            {(() => { const ListItemIcon = itemMeta(item).icon; return <ListItemIcon size={18} weight="duotone" aria-hidden="true" />; })()}
                          </span>
                          <div>
                            <span className="font-bold text-[#8f4458]">{item.code}</span>
                            <p className="max-w-[260px] truncate font-semibold text-[#211A1D]" title={item.title}>{item.title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1.5">
                          <ItemTypeBadge item={item} compact />
                          <ItemSourceBadge item={item} />
                        </div>
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-[#211A1D]">{itemMeta(item).source}</p>
                      </td>
                      <td className="p-3.5">
                        {item.scope === "GLOBAL" ? (
                          <span className="rounded-full bg-[#f1eef4] px-2 py-0.5 text-[10px] font-bold text-[#746A6E]">
                            Dùng chung
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-[#8a6000]">
                            {item.courseName || "Riêng khóa"}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-[#746A6E]">
                        {formatDate(item.updatedAt)}
                      </td>
                      <td className="p-3.5">{statusBadge(item.status)}</td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setAttachingItem(item)}
                            className="grid h-10 w-10 place-items-center rounded-xl text-[#237653] hover:bg-emerald-50"
                            title="Gắn vào session"
                            aria-label={`Gắn ${item.title} vào buổi học`}
                          >
                            <Plus size={17} />
                          </button>
                          <button
                            onClick={() => { setEditing(item); setModalOpen(true); }}
                            className="grid h-10 w-10 place-items-center rounded-xl text-[#8f4458] hover:bg-[#f7e7ec]"
                            title="Sửa"
                            aria-label={`Chỉnh sửa ${item.title}`}
                          >
                            <NotePencil size={17} />
                          </button>
                          <button
                            onClick={() => setArchiving(item)}
                            className="grid h-10 w-10 place-items-center rounded-xl text-[#b4232d] hover:bg-rose-50"
                            title="Lưu trữ"
                            aria-label={`Lưu trữ ${item.title}`}
                          >
                            <Trash size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

        </main>
      </div>

      {/* Modals */}
      <LibraryItemModal
        open={modalOpen}
        view={view}
        skill="READING"
        item={editing}
        courseId={courseId}
        courses={courses}
        folders={folders}
        folderId={selectedFolderId !== "ALL" && selectedFolderId !== "GLOBAL" ? selectedFolderId : undefined}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />
      <CloudUploadDialog
        open={uploadOpen}
        folders={folders}
        folderId={selectedFolderId !== "ALL" && selectedFolderId !== "GLOBAL" ? selectedFolderId : undefined}
        courseId={courseId}
        onClose={() => setUploadOpen(false)}
        onSaved={handleSaved}
      />
      <CreateLibraryFolderDialog
        open={folderDialogOpen}
        courses={courses}
        onClose={() => setFolderDialogOpen(false)}
        onCreated={handleFolderCreated}
      />
      <ResourceFilesDialog resource={resourceFiles} onClose={() => setResourceFiles(null)} />
      {attachingItem && (
        <AttachLibraryModal
          item={attachingItem}
          courses={courses}
          onClose={() => setAttachingItem(null)}
          onSuccess={() => {
            setNotice(`Đã gắn "${attachingItem.title}" vào session khóa học.`);
            setAttachingItem(null);
            setTimeout(() => setNotice(""), 3500);
          }}
        />
      )}
      {archiving && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-[20px] bg-white p-6 shadow-2xl">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-rose-50 text-[#b4232d]">
              <Trash size={22} />
            </span>
            <h3 className="mt-4 font-display text-lg font-bold text-[#211A1D]">Xác nhận lưu trữ học liệu?</h3>
            <p className="mt-2 text-xs leading-5 text-[#746A6E]">
              Học liệu <strong>{archiving.title}</strong> sẽ được chuyển sang trạng thái Archived. Không làm ảnh hưởng các session đã tham chiếu trước đó.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setArchiving(null)} className="min-h-[40px] rounded-xl border border-[#e3dce2] px-4 text-xs font-bold">
                Hủy
              </button>
              <button onClick={() => void archive()} className="min-h-[40px] rounded-xl bg-[#b4232d] px-4 text-xs font-bold text-white">
                Xác nhận lưu trữ
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
