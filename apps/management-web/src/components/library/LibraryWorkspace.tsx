import {
  Archive, ArrowSquareOut, Article, BookOpenText, Books, Check, ClipboardText, FileAudio,
  DotsThreeVertical, FileDoc, FileText, FileVideo, Funnel, GridFour, Link, List, MagnifyingGlass,
  NotePencil, Plus, TextT, Trash, WarningCircle,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import type { Course, Page } from "../../academic-types";
import type { ContentLifecycleStatus, ExerciseTemplate, LearningResource, LearningResourceType, LibraryItem, LibrarySkill, LibraryView } from "../../library-types";
import { isResource } from "../../library-types";
import { apiFetch } from "../../lib/api";
import LibraryItemModal from "./LibraryItemModal";
import ResourceFilesDialog from "./ResourceFilesDialog";
import AttachLibraryModal from "./AttachLibraryModal";
import { ALL_CATEGORIES, CATEGORIES, RESOURCE_TYPE_LABELS, SKILLS, SKILL_LABELS, categoryLabel } from "./library-config";

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

function skillLabel(value: string) {
  return SKILL_LABELS[value as LibrarySkill] ?? (value === "GENERAL" ? "Chung" : value);
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
  const [view, setView] = useState<LibraryView>("RESOURCES");
  const [skill, setSkill] = useState<LibrarySkill | "ALL">("ALL");
  const [category, setCategory] = useState("ALL");
  const [scope, setScope] = useState(courseId ? "ALL" : "GLOBAL");
  const [statusFilter, setStatusFilter] = useState<ContentLifecycleStatus | "ALL">("ALL");
  const [viewMode, setViewMode] = useState<"GRID" | "LIST">("GRID");
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
  const [attachingItem, setAttachingItem] = useState<LibraryItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ size: "100" });
      if (skill !== "ALL") params.set("skill", skill);
      if (category !== "ALL") params.set("category", category);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (deferredQuery.trim()) params.set("query", deferredQuery.trim());
      if (courseId) { params.set("courseId", courseId); params.set("includeGlobal", "true"); }
      else if (scope !== "ALL") params.set("scope", scope);
      const endpoint = view === "RESOURCES" ? "resources" : "exercises";
      const result = await apiFetch<Page<LearningResource | ExerciseTemplate>>(`/admin/library/${endpoint}?${params}`);
      setItems(result.content);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không tải được kho học liệu.");
    } finally { setLoading(false); }
  }, [category, courseId, deferredQuery, scope, skill, statusFilter, view]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (courseId) return;
    void apiFetch<Page<Course>>("/admin/courses?size=100").then(result => setCourses(result.content)).catch(() => setCourses([]));
  }, [courseId]);
  useEffect(() => {
    if (skill !== "ALL" && category !== "ALL" && !CATEGORIES[skill].some(option => option.value === category)) {
      setCategory("ALL");
    }
  }, [category, skill]);

  const visibleItems = useMemo(() => {
    return items.filter(item => {
      if (isResource(item) && item.category === "MEDIA") return false;
      if (category !== "ALL" && item.category !== category) return false;
      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
      return true;
    });
  }, [category, items, statusFilter]);

  const categoryOptions = useMemo(() => skill === "ALL"
    ? ALL_CATEGORIES
    : CATEGORIES[skill], [skill]);
  const summary = useMemo(() => ({
    total: visibleItems.length,
    published: visibleItems.filter(item => item.status === "PUBLISHED").length,
  }), [visibleItems]);

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

  return (
    <section className="space-y-4">
      {!compactHeader && (
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-[#8f4458]">
              NỘI DUNG ĐÀO TẠO
            </span>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#211A1D]">
              Kho học liệu giảng dạy
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#746A6E]">
              Phân loại rõ nội dung, định dạng file và phạm vi sử dụng để tìm, xem và gắn học liệu nhanh hơn.
            </p>
          </div>
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            aria-label={`Thêm ${view === "RESOURCES" ? "tài liệu" : "bài tập mẫu"}`}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#8f4458] px-5 text-sm font-bold text-white shadow-sm hover:bg-[#743447]"
          >
            <Plus size={18} weight="bold" />
            Thêm {view === "RESOURCES" ? "tài liệu" : "bài tập"}
          </button>
        </header>
      )}

      {/* Skill Bar Filter */}
      <div className="rounded-[18px] border border-[#e3dce2] bg-white p-4 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex max-w-full overflow-x-auto rounded-xl bg-[#f1eef4] p-1" role="tablist" aria-label="Loại kho học liệu">
            <button
              onClick={() => setView("RESOURCES")}
              role="tab"
              aria-selected={view === "RESOURCES"}
              className={`inline-flex min-h-[36px] items-center gap-2 rounded-lg px-4 text-xs font-bold transition ${
                view === "RESOURCES" ? "bg-white text-[#8f4458] shadow-sm" : "text-[#746A6E]"
              }`}
            >
              <Books size={16} />
              Kho tài liệu
            </button>
            <button
              onClick={() => setView("EXERCISES")}
              role="tab"
              aria-selected={view === "EXERCISES"}
              className={`inline-flex min-h-[36px] items-center gap-2 rounded-lg px-4 text-xs font-bold transition ${
                view === "EXERCISES" ? "bg-white text-[#8f4458] shadow-sm" : "text-[#746A6E]"
              }`}
            >
              <BookOpenText size={16} />
              Kho bài tập mẫu
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#746A6E]">Hiển thị:</span>
            <div className="inline-flex rounded-xl border border-[#e3dce2] bg-white p-0.5" role="group" aria-label="Chế độ hiển thị kho học liệu">
              <button
                onClick={() => setViewMode("LIST")}
                aria-pressed={viewMode === "LIST"}
                className={`grid h-11 w-11 place-items-center rounded-lg text-xs transition ${
                  viewMode === "LIST" ? "bg-[#8f4458] text-white" : "text-[#746A6E] hover:bg-[#f1eef4]"
                }`}
                title="Hiển thị dạng danh sách"
                aria-label="Hiển thị dạng danh sách"
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode("GRID")}
                aria-pressed={viewMode === "GRID"}
                className={`grid h-11 w-11 place-items-center rounded-lg text-xs transition ${
                  viewMode === "GRID" ? "bg-[#8f4458] text-white" : "text-[#746A6E] hover:bg-[#f1eef4]"
                }`}
                title="Hiển thị dạng lưới"
                aria-label="Hiển thị dạng lưới"
              >
                <GridFour size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Skill Pills */}
        <div className="flex gap-2 overflow-x-auto border-t border-[#e3dce2]/60 pt-3 pb-1" aria-label="Lọc theo kỹ năng">
          <button
            onClick={() => setSkill("ALL")}
            aria-pressed={skill === "ALL"}
            className={`min-h-[42px] shrink-0 rounded-xl border px-4 text-xs font-bold transition ${
              skill === "ALL"
                ? "border-[#8f4458] bg-[#f7e7ec] text-[#743447]"
                : "border-[#e3dce2] bg-white text-[#746A6E] hover:border-[#8f4458]/40"
            }`}
          >
            Tất cả kỹ năng
          </button>
          {SKILLS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSkill(s.id)}
              aria-pressed={skill === s.id}
              className={`min-h-[42px] shrink-0 rounded-xl border px-4 text-xs font-bold transition ${
                skill === s.id
                  ? "border-[#8f4458] bg-[#f7e7ec] text-[#743447]"
                  : "border-[#e3dce2] bg-white text-[#746A6E] hover:border-[#8f4458]/40"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Multi-parameter Filter Toolbar */}
      <div className="space-y-3 rounded-[18px] border border-[#e3dce2] bg-white p-4">
        <div className="flex items-center gap-2 text-xs font-bold text-[#211A1D]"><Funnel size={16} className="text-[#8f4458]" /> Bộ lọc học liệu</div>
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_repeat(3,minmax(150px,190px))]">
          <label className="relative">
            <span className="sr-only">Tìm theo tên, mã hoặc mô tả</span>
            <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#746A6E]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tên, mã, mô tả hoặc tag..."
              className="min-h-[44px] w-full rounded-xl border border-[#e3dce2] bg-white pl-10 pr-4 text-xs focus:border-[#8f4458] focus:outline-none focus:ring-2 focus:ring-[#f7e7ec]"
            />
          </label>

          <label className="sr-only" htmlFor="library-category">Nhóm nội dung</label>
          <select id="library-category" value={category} onChange={(e) => setCategory(e.target.value)} className="min-h-[44px] rounded-xl border border-[#e3dce2] bg-white px-3 text-xs font-semibold text-[#211A1D] focus:border-[#8f4458] focus:outline-none focus:ring-2 focus:ring-[#f7e7ec]">
            <option value="ALL">Tất cả nhóm nội dung</option>
            {categoryOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>

          {!courseId ? (
            <>
              <label className="sr-only" htmlFor="library-scope">Phạm vi sử dụng</label>
              <select id="library-scope" value={scope} onChange={(e) => setScope(e.target.value)} className="min-h-[44px] rounded-xl border border-[#e3dce2] bg-white px-3 text-xs font-semibold text-[#211A1D] focus:border-[#8f4458] focus:outline-none focus:ring-2 focus:ring-[#f7e7ec]">
                <option value="GLOBAL">Dùng chung</option>
                <option value="COURSE">Riêng khóa học</option>
                <option value="ALL">Tất cả phạm vi</option>
              </select>
            </>
          ) : <span className="hidden lg:block" aria-hidden="true" />}

          <label className="sr-only" htmlFor="library-status">Trạng thái</label>
          <select id="library-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ContentLifecycleStatus | "ALL")} className="min-h-[44px] rounded-xl border border-[#e3dce2] bg-white px-3 text-xs font-semibold text-[#211A1D] focus:border-[#8f4458] focus:outline-none focus:ring-2 focus:ring-[#f7e7ec]">
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PUBLISHED">Đã xuất bản</option>
            <option value="DRAFT">Bản nháp</option>
            <option value="ARCHIVED">Đã lưu trữ</option>
          </select>
        </div>
      </div>

      {!loading && !error && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-[#746A6E]" aria-live="polite">
          <p>
            <strong className="text-sm text-[#211A1D]">{summary.total}</strong>{" "}
            {view === "RESOURCES" ? "tài liệu" : "bài tập mẫu"}
            <span className="mx-2 text-[#c9c0c5]">•</span>
            {summary.published} đã xuất bản
          </p>
          <p className="hidden sm:block">Sắp xếp theo lần cập nhật gần nhất</p>
        </div>
      )}

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
            Tạo học liệu mới hoặc điều chỉnh nhóm nội dung, kỹ năng và trạng thái để xem thêm kết quả.
          </p>
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
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
                        <p className="mt-1 truncate text-[10px] font-semibold text-[#746A6E]" title={`${categoryLabel(item.skill, item.category)} · ${skillLabel(item.skill)}`}>
                          {categoryLabel(item.skill, item.category)} · {skillLabel(item.skill)}
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
                    <th className="p-3.5">Kỹ năng</th>
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
                        <p className="font-semibold text-[#211A1D]">{skillLabel(item.skill)}</p>
                        <p className="mt-1 text-[11px] text-[#746A6E]">{categoryLabel(item.skill, item.category)}</p>
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

      {/* Modals */}
      <LibraryItemModal
        open={modalOpen}
        view={view}
        skill={skill === "ALL" ? "LISTENING" : skill}
        item={editing}
        courseId={courseId}
        courses={courses}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
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
