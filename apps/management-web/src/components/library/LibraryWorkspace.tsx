import {
  Archive, ArrowSquareOut, BookOpenText, Books, Check, Eye, FileAudio, FileText,
  Funnel, GridFour, List, MagnifyingGlass, NotePencil, Plus, SpinnerGap, Trash, WarningCircle,
} from "@phosphor-icons/react";
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import type { Course, Page } from "../../academic-types";
import type { ContentLifecycleStatus, ExerciseTemplate, LearningResource, LibraryItem, LibrarySkill, LibraryView } from "../../library-types";
import { isResource } from "../../library-types";
import { apiFetch } from "../../lib/api";
import LibraryItemModal from "./LibraryItemModal";
import ResourceFilesDialog from "./ResourceFilesDialog";
import AttachLibraryModal from "./AttachLibraryModal";
import { CATEGORIES, SKILLS, categoryLabel } from "./library-config";

type Props = { courseId?: string; compactHeader?: boolean };

const itemIcon = (item: LibraryItem) => {
  if (!isResource(item)) return <BookOpenText size={20} weight="duotone" />;
  if (item.resourceType === "AUDIO") return <FileAudio size={20} weight="duotone" />;
  if (item.resourceType === "TEACHER_NOTE") return <NotePencil size={20} weight="duotone" />;
  return <FileText size={20} weight="duotone" />;
};

const statusBadge = (status: ContentLifecycleStatus) => {
  switch (status) {
    case "PUBLISHED":
      return <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-[#237653]">Published</span>;
    case "IN_REVIEW":
      return <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-[#8a6000]">Chờ duyệt</span>;
    case "DRAFT":
      return <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-bold text-[#746A6E]">Draft</span>;
    case "ARCHIVED":
      return <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-[#b4232d]">Archived</span>;
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
    void apiFetch<Page<Course>>("/admin/courses?size=100").then(result => setCourses(result.content)).catch(() => setCourses([]));
  }, [courseId]);

  const visibleItems = useMemo(() => {
    return items.filter(item => {
      if (category !== "ALL" && item.category !== category) return false;
      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
      return true;
    });
  }, [category, items, statusFilter]);

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
    <section className="space-y-6">
      {!compactHeader && (
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-[#8f4458]">
              NỘI DUNG ĐÀO TẠO
            </span>
            <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl text-[#211A1D]">
              Kho học liệu giảng dạy
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#746A6E]">
              Quản lý tài liệu giảng dạy, bài tập mẫu và phương pháp làm bài. Gắn linh hoạt vào các khóa học mà không nhân bản dữ liệu.
            </p>
          </div>
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
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
          <div className="inline-flex rounded-xl bg-[#f1eef4] p-1">
            <button
              onClick={() => setView("RESOURCES")}
              className={`inline-flex min-h-[36px] items-center gap-2 rounded-lg px-4 text-xs font-bold transition ${
                view === "RESOURCES" ? "bg-white text-[#8f4458] shadow-sm" : "text-[#746A6E]"
              }`}
            >
              <Books size={16} />
              Kho tài liệu
            </button>
            <button
              onClick={() => setView("EXERCISES")}
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
            <div className="inline-flex rounded-xl border border-[#e3dce2] bg-white p-0.5">
              <button
                onClick={() => setViewMode("GRID")}
                className={`grid h-8 w-8 place-items-center rounded-lg text-xs transition ${
                  viewMode === "GRID" ? "bg-[#8f4458] text-white" : "text-[#746A6E]"
                }`}
                title="Chế độ Lưới (Grid)"
              >
                <GridFour size={18} />
              </button>
              <button
                onClick={() => setViewMode("LIST")}
                className={`grid h-8 w-8 place-items-center rounded-lg text-xs transition ${
                  viewMode === "LIST" ? "bg-[#8f4458] text-white" : "text-[#746A6E]"
                }`}
                title="Chế độ Danh sách (List)"
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Skill Pills */}
        <div className="grid grid-cols-5 gap-2 pt-2 border-t border-[#e3dce2]/60">
          <button
            onClick={() => setSkill("ALL")}
            className={`min-h-[38px] rounded-xl border px-3 text-xs font-bold transition ${
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
              className={`min-h-[38px] rounded-xl border px-3 text-xs font-bold transition ${
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
      <div className="flex flex-col gap-3 rounded-[18px] border border-[#e3dce2] bg-white p-4 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Tìm theo tên, mã hoặc mô tả</span>
          <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#746A6E]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên, mã tài liệu, mô tả hoặc tag..."
            className="min-h-[42px] w-full rounded-xl border border-[#e3dce2] bg-white pl-10 pr-4 text-xs focus:border-[#8f4458] focus:outline-none"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          {!courseId && (
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="min-h-[42px] rounded-xl border border-[#e3dce2] bg-white px-3 text-xs font-semibold text-[#211A1D] focus:border-[#8f4458] focus:outline-none"
            >
              <option value="GLOBAL">Dùng chung</option>
              <option value="COURSE">Riêng khóa học</option>
              <option value="ALL">Tất cả phạm vi</option>
            </select>
          )}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ContentLifecycleStatus | "ALL")}
            className="min-h-[42px] rounded-xl border border-[#e3dce2] bg-white px-3 text-xs font-semibold text-[#211A1D] focus:border-[#8f4458] focus:outline-none"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PUBLISHED">Published</option>
            <option value="IN_REVIEW">Chờ duyệt</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
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
        <div className="grid min-h-[200px] place-items-center rounded-[18px] border border-[#e3dce2] bg-white">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#746A6E]">
            <SpinnerGap className="animate-spin" size={18} />
            Đang tải dữ liệu học liệu...
          </span>
        </div>
      )}

      {!loading && !error && visibleItems.length === 0 && (
        <div className="rounded-[18px] border border-dashed border-[#e3dce2] bg-white p-10 text-center">
          <Archive size={36} className="mx-auto text-[#746A6E]" />
          <h3 className="mt-3 font-display text-lg font-bold text-[#211A1D]">Chưa có học liệu phù hợp</h3>
          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-[#746A6E]">
            Tạo học liệu đầu tiên hoặc điều chỉnh các tiêu chí tìm kiếm.
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visibleItems.map((item) => {
                const externalUrl = isResource(item) ? item.externalUrl : item.sourceUrl;
                return (
                  <article
                    key={item.id}
                    className="flex flex-col justify-between rounded-[18px] border border-[#e3dce2] bg-white p-5 transition hover:border-[#8f4458]/40 hover:shadow-sm"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f7e7ec] text-[#8f4458]">
                          {itemIcon(item)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {statusBadge(item.status)}
                          {item.scope === "COURSE" && (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-[#8a6000]">
                              Riêng khóa
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-3">
                        <span className="text-xs font-bold text-[#8f4458]">{item.code}</span>
                        <h3 className="mt-1 font-display text-base font-bold text-[#211A1D] line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[#746A6E]">
                          {isResource(item) ? item.description || "Chưa có mô tả." : item.instructions || "Chưa có hướng dẫn."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-[#e3dce2]/60 pt-4 space-y-3">
                      <div className="flex items-center justify-between text-[11px] text-[#746A6E]">
                        <span>Dùng trong <strong>{item.usageCount ?? 2}</strong> khóa</span>
                        <span>Cập nhật {new Date(item.updatedAt).toLocaleDateString("vi-VN")}</span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex gap-1">
                          {isResource(item) && (
                            <button
                              onClick={() => setResourceFiles(item)}
                              className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-[#e3dce2] px-2.5 text-xs font-bold text-[#8f4458] hover:bg-[#f7e7ec]"
                            >
                              <FileText size={15} />
                              File đính kèm
                            </button>
                          )}
                          {externalUrl && (
                            <a
                              href={externalUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-[#e3dce2] px-2.5 text-xs font-bold text-[#8f4458] hover:bg-[#f7e7ec]"
                            >
                              <ArrowSquareOut size={15} />
                              Drive
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setAttachingItem(item)}
                            title="Gắn vào session khóa học"
                            className="grid h-8 w-8 place-items-center rounded-lg text-[#237653] hover:bg-emerald-50"
                          >
                            <Plus size={16} />
                          </button>
                          <button
                            onClick={() => { setEditing(item); setModalOpen(true); }}
                            title="Chỉnh sửa"
                            className="grid h-8 w-8 place-items-center rounded-lg text-[#8f4458] hover:bg-[#f7e7ec]"
                          >
                            <NotePencil size={16} />
                          </button>
                          <button
                            onClick={() => setArchiving(item)}
                            title="Lưu trữ"
                            className="grid h-8 w-8 place-items-center rounded-lg text-[#b4232d] hover:bg-rose-50"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            /* LIST VIEW TABLE */
            <div className="overflow-hidden rounded-[18px] border border-[#e3dce2] bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f1eef4] text-[#746A6E] font-bold uppercase tracking-wider text-[11px]">
                    <th className="p-3.5">Mã & Tên học liệu</th>
                    <th className="p-3.5">Kỹ năng</th>
                    <th className="p-3.5">Phạm vi</th>
                    <th className="p-3.5">Tham chiếu</th>
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
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#f7e7ec] text-[#8f4458]">
                            {itemIcon(item)}
                          </span>
                          <div>
                            <span className="font-bold text-[#8f4458]">{item.code}</span>
                            <p className="font-semibold text-[#211A1D]">{item.title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-semibold text-[#211A1D]">{item.skill}</td>
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
                      <td className="p-3.5 font-semibold text-[#211A1D]">{item.usageCount ?? 2} khóa</td>
                      <td className="p-3.5 text-[#746A6E]">
                        {new Date(item.updatedAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="p-3.5">{statusBadge(item.status)}</td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setAttachingItem(item)}
                            className="rounded-lg p-1.5 text-[#237653] hover:bg-emerald-50"
                            title="Gắn vào session"
                          >
                            <Plus size={16} />
                          </button>
                          <button
                            onClick={() => { setEditing(item); setModalOpen(true); }}
                            className="rounded-lg p-1.5 text-[#8f4458] hover:bg-[#f7e7ec]"
                            title="Sửa"
                          >
                            <NotePencil size={16} />
                          </button>
                          <button
                            onClick={() => setArchiving(item)}
                            className="rounded-lg p-1.5 text-[#b4232d] hover:bg-rose-50"
                            title="Lưu trữ"
                          >
                            <Trash size={16} />
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
