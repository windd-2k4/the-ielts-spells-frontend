import { PencilSimple, Power } from "@phosphor-icons/react";
import { useCallback, useDeferredValue, useEffect, useMemo, useState, type FormEvent } from "react";
import type { Course, CourseForm, Page } from "../academic-types";
import { courseEmpty, money } from "../academic-types";
import { Drawer, LoadState, PageHeader, PrimaryAction, SearchField, StatusBadge } from "../components/AdminUi";
import { apiFetch } from "../lib/api";

export function CoursesPage() {
  const [items, setItems] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("all");
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState<CourseForm>(courseEmpty);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const suffix = active === "all" ? "" : `&active=${active}`;
      const page = await apiFetch<Page<Course>>(`/admin/courses?size=100${suffix}`);
      setItems(page.content);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không tải được khóa học");
    } finally {
      setLoading(false);
    }
  }, [active]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () =>
      items.filter(item =>
        `${item.code} ${item.name} ${item.level ?? ""}`
          .toLowerCase()
          .includes(deferredQuery.toLowerCase())
      ),
    [items, deferredQuery]
  );

  function create() {
    setEditing(null);
    setForm(courseEmpty);
    setOpen(true);
  }

  function edit(item: Course) {
    setEditing(item);
    setForm({
      code: item.code,
      name: item.name,
      description: item.description ?? "",
      level: item.level ?? "",
      targetBand: item.targetBand?.toString() ?? "",
      totalSessions: item.totalSessions?.toString() ?? "",
      tuitionAmount: item.tuitionAmount?.toString() ?? "",
      isPublic: item.isPublic,
      isActive: item.isActive,
    });
    setOpen(true);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const body = {
      name: form.name,
      description: form.description || null,
      level: form.level || null,
      targetBand: form.targetBand ? Number(form.targetBand) : null,
      totalSessions: form.totalSessions ? Number(form.totalSessions) : null,
      tuitionAmount: form.tuitionAmount ? Number(form.tuitionAmount) : null,
      isPublic: form.isPublic,
      isActive: form.isActive,
    };
    try {
      if (editing) {
        await apiFetch(`/admin/courses/${editing.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await apiFetch("/admin/courses", {
          method: "POST",
          body: JSON.stringify({ code: form.code, ...body }),
        });
      }
      setOpen(false);
      await load();
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không thể lưu khóa học");
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(item: Course) {
    if (!window.confirm(`Ngừng hoạt động khóa học ${item.name}?`)) return;
    try {
      await apiFetch(`/admin/courses/${item.id}`, { method: "DELETE" });
      await load();
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không thể ngừng khóa học");
    }
  }

  const field = (key: keyof CourseForm) => ({
    value: String(form[key] ?? ""),
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm({ ...form, [key]: event.target.value }),
  });

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Học vụ"
        title="Quản lý khóa học"
        description="Thiết lập chương trình, band mục tiêu, học phí và trạng thái công khai."
        action={<PrimaryAction onClick={create}>Thêm khóa học</PrimaryAction>}
      />

      {/* Toolbar / Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center bg-surface p-4 rounded-2xl border border-outline-variant/30 shadow-sm">
        <SearchField value={query} onChange={setQuery} placeholder="Tìm theo mã, tên hoặc trình độ" />
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant shrink-0">Trạng thái</label>
          <select
            value={active}
            onChange={event => setActive(event.target.value)}
            className="w-full md:w-48 px-3 py-2 border border-outline-variant/60 rounded-xl bg-surface text-label-md font-label-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-on-surface-variant transition-all"
          >
            <option value="all">Tất cả</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Ngừng hoạt động</option>
          </select>
        </div>
      </div>

      <LoadState loading={loading} error={error} empty={!visible.length} onRetry={() => void load()} />

      {!loading && !error && visible.length > 0 && (
        <div className="bg-surface rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm min-w-[800px]">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/30">
                  <th className="text-on-surface-variant font-bold text-xs uppercase tracking-wider px-6 py-4">Khóa học</th>
                  <th className="text-on-surface-variant font-bold text-xs uppercase tracking-wider px-6 py-4">Trình độ</th>
                  <th className="text-on-surface-variant font-bold text-xs uppercase tracking-wider px-6 py-4">Band mục tiêu</th>
                  <th className="text-on-surface-variant font-bold text-xs uppercase tracking-wider px-6 py-4">Thời lượng</th>
                  <th className="text-on-surface-variant font-bold text-xs uppercase tracking-wider px-6 py-4">Học phí</th>
                  <th className="text-on-surface-variant font-bold text-xs uppercase tracking-wider px-6 py-4">Trạng thái</th>
                  <th className="text-on-surface-variant font-bold text-xs uppercase tracking-wider px-6 py-4 w-28">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(item => (
                  <tr key={item.id} className="hover:bg-surface-container-low/40 transition-colors">
                    <td className="px-6 py-4 border-t border-outline-variant/20">
                      <strong className="text-on-surface block text-sm font-semibold">{item.name}</strong>
                      <span className="text-xs text-on-surface-variant font-mono mt-0.5 block">{item.code}</span>
                    </td>
                    <td className="px-6 py-4 border-t border-outline-variant/20 text-on-surface-variant">
                      {item.level || "—"}
                    </td>
                    <td className="px-6 py-4 border-t border-outline-variant/20 font-bold text-on-surface">
                      {item.targetBand ?? "—"}
                    </td>
                    <td className="px-6 py-4 border-t border-outline-variant/20 text-on-surface-variant">
                      {item.totalSessions ? `${item.totalSessions} buổi` : "—"}
                    </td>
                    <td className="px-6 py-4 border-t border-outline-variant/20 font-semibold text-on-surface">
                      {money(item.tuitionAmount)}
                    </td>
                    <td className="px-6 py-4 border-t border-outline-variant/20">
                      <StatusBadge value={item.isActive ? "active" : "inactive"}>
                        {item.isActive ? "Hoạt động" : "Ngừng hoạt động"}
                      </StatusBadge>
                    </td>
                    <td className="px-6 py-4 border-t border-outline-variant/20">
                      <div className="flex items-center gap-2">
                        <button
                          aria-label={`Sửa ${item.name}`}
                          onClick={() => edit(item)}
                          className="w-9 h-9 flex items-center justify-center border border-outline-variant/60 rounded-xl hover:bg-surface-container text-primary transition-colors"
                        >
                          <PencilSimple size={16} />
                        </button>
                        {item.isActive && (
                          <button
                            aria-label={`Ngừng ${item.name}`}
                            onClick={() => void deactivate(item)}
                            className="w-9 h-9 flex items-center justify-center border border-error/30 rounded-xl hover:bg-error-container/20 text-error transition-colors"
                          >
                            <Power size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {open && (
        <Drawer
          title={editing ? "Cập nhật khóa học" : "Thêm khóa học"}
          description="Thông tin này được dùng xuyên suốt trong lớp học và tuyển sinh."
          onClose={() => setOpen(false)}
        >
          <form className="space-y-4 flex flex-col h-full" onSubmit={save}>
            <div className="space-y-4 flex-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Mã khóa học</label>
                <input
                  required
                  disabled={!!editing}
                  {...field("code")}
                  className="px-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none disabled:bg-surface-container disabled:text-on-surface-variant transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tên khóa học</label>
                <input
                  required
                  {...field("name")}
                  className="px-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Trình độ</label>
                  <input
                    {...field("level")}
                    placeholder="Foundation, 6.5+..."
                    className="px-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Band mục tiêu</label>
                  <input
                    type="number"
                    min="0"
                    max="9"
                    step="0.5"
                    {...field("targetBand")}
                    className="px-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tổng số buổi</label>
                  <input
                    type="number"
                    min="1"
                    {...field("totalSessions")}
                    className="px-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Học phí</label>
                  <input
                    type="number"
                    min="0"
                    {...field("tuitionAmount")}
                    className="px-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Mô tả</label>
                <textarea
                  rows={4}
                  {...field("description")}
                  className="px-4 py-2.5 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none resize-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-3 p-4 bg-surface-container-low rounded-xl border border-outline-variant/20">
                <label className="inline-flex items-center gap-3 cursor-pointer select-none text-sm text-on-surface-variant font-medium">
                  <input
                    type="checkbox"
                    checked={form.isPublic}
                    onChange={event => setForm({ ...form, isPublic: event.target.checked })}
                    className="w-4 h-4 text-primary border-outline-variant rounded focus:ring-primary focus:ring-1"
                  />
                  Công khai trên website tuyển sinh
                </label>
                {editing && (
                  <label className="inline-flex items-center gap-3 cursor-pointer select-none text-sm text-on-surface-variant font-medium">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={event => setForm({ ...form, isActive: event.target.checked })}
                      className="w-4 h-4 text-primary border-outline-variant rounded focus:ring-primary focus:ring-1"
                    />
                    Đang hoạt động tuyển sinh
                  </label>
                )}
              </div>
            </div>

            {error && (
              <p className="text-xs font-semibold text-error bg-error-container/20 border border-error/20 p-3 rounded-xl" role="alert">
                {error}
              </p>
            )}

            <footer className="sticky bottom-0 flex justify-end gap-3 pt-4 border-t border-outline-variant/20 bg-surface">
              <button
                type="button"
                className="px-5 py-2.5 border border-outline-variant/60 hover:bg-surface-container rounded-full text-sm font-semibold transition-colors"
                onClick={() => setOpen(false)}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-primary hover:opacity-95 text-on-primary rounded-full text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {saving ? "Đang lưu..." : "Lưu khóa học"}
              </button>
            </footer>
          </form>
        </Drawer>
      )}
    </section>
  );
}
