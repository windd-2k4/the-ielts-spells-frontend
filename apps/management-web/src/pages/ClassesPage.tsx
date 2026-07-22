import { PencilSimple } from "@phosphor-icons/react";
import { useCallback, useDeferredValue, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import type { AcademicClass, ClassForm, Course, Page } from "../academic-types";
import { classEmpty, classStatusLabel, date } from "../academic-types";
import { Drawer, LoadState, PageHeader, PrimaryAction, SearchField, StatusBadge } from "../components/AdminUi";
import { apiFetch } from "../lib/api";

export function ClassesPage() {
  const [items, setItems] = useState<AcademicClass[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [courseId, setCourseId] = useState("all");
  const [editing, setEditing] = useState<AcademicClass | null>(null);
  const [form, setForm] = useState<ClassForm>(classEmpty);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ size: "100" });
      if (courseId !== "all") params.set("courseId", courseId);
      else if (status !== "all") params.set("status", status);
      const [classPage, coursePage] = await Promise.all([
        apiFetch<Page<AcademicClass>>(`/admin/classes?${params}`),
        apiFetch<Page<Course>>("/admin/courses?size=100&active=true"),
      ]);
      setItems(classPage.content);
      setCourses(coursePage.content);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không tải được lớp học");
    } finally {
      setLoading(false);
    }
  }, [courseId, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () =>
      items.filter(
        item =>
          `${item.code} ${item.name}`.toLowerCase().includes(deferredQuery.toLowerCase()) &&
          (status === "all" || item.status === status)
      ),
    [items, deferredQuery, status]
  );

  const courseName = (id: string) => courses.find(item => item.id === id)?.name ?? "Khóa học không xác định";

  function create() {
    setEditing(null);
    setForm({ ...classEmpty, courseId: courses[0]?.id ?? "" });
    setOpen(true);
  }

  function edit(item: AcademicClass) {
    setEditing(item);
    setForm({
      courseId: item.courseId,
      code: item.code,
      name: item.name,
      capacity: String(item.capacity),
      startsOn: item.startsOn,
      endsOn: item.endsOn ?? "",
      status: item.status,
      defaultZoomUrl: item.defaultZoomUrl ?? "",
    });
    setOpen(true);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const body = {
      name: form.name,
      capacity: Number(form.capacity),
      startsOn: form.startsOn,
      endsOn: form.endsOn || null,
      status: form.status,
      defaultZoomUrl: form.defaultZoomUrl || null,
    };
    try {
      if (editing) {
        await apiFetch(`/admin/classes/${editing.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await apiFetch("/admin/classes", {
          method: "POST",
          body: JSON.stringify({ courseId: form.courseId, code: form.code, ...body }),
        });
      }
      setOpen(false);
      await load();
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không thể lưu lớp học");
    } finally {
      setSaving(false);
    }
  }

  const field = (key: keyof ClassForm) => ({
    value: form[key],
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [key]: event.target.value }),
  });

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Tổ chức đào tạo"
        title="Quản lý lớp học"
        description="Theo dõi kỳ học, sức chứa, tiến độ vận hành và đường dẫn Zoom mặc định."
        action={<PrimaryAction onClick={create}>Thêm lớp học</PrimaryAction>}
      />

      {/* Toolbar / Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center bg-surface p-4 rounded-2xl border border-outline-variant/30 shadow-sm">
        <SearchField value={query} onChange={setQuery} placeholder="Tìm mã hoặc tên lớp" />

        <div className="flex flex-wrap md:flex-nowrap gap-4 items-center w-full md:w-auto">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant shrink-0">Khóa học</label>
            <select
              value={courseId}
              onChange={event => setCourseId(event.target.value)}
              className="w-full md:w-56 px-3 py-2 border border-outline-variant/60 rounded-xl bg-surface text-label-md font-label-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-on-surface-variant transition-all"
            >
              <option value="all">Tất cả khóa học</option>
              {courses.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant shrink-0">Trạng thái</label>
            <select
              value={status}
              onChange={event => setStatus(event.target.value)}
              className="w-full md:w-44 px-3 py-2 border border-outline-variant/60 rounded-xl bg-surface text-label-md font-label-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-on-surface-variant transition-all"
            >
              <option value="all">Tất cả</option>
              {Object.entries(classStatusLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <LoadState loading={loading} error={error} empty={!visible.length} onRetry={() => void load()} />

      {!loading && !error && visible.length > 0 && (
        <div className="bg-surface rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm min-w-[900px]">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/30">
                  <th className="text-on-surface-variant font-bold text-xs uppercase tracking-wider px-6 py-4">Lớp học</th>
                  <th className="text-on-surface-variant font-bold text-xs uppercase tracking-wider px-6 py-4">Khóa học</th>
                  <th className="text-on-surface-variant font-bold text-xs uppercase tracking-wider px-6 py-4">Thời gian</th>
                  <th className="text-on-surface-variant font-bold text-xs uppercase tracking-wider px-6 py-4">Sức chứa</th>
                  <th className="text-on-surface-variant font-bold text-xs uppercase tracking-wider px-6 py-4">Trạng thái</th>
                  <th className="text-on-surface-variant font-bold text-xs uppercase tracking-wider px-6 py-4">Zoom</th>
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
                    <td className="px-6 py-4 border-t border-outline-variant/20 text-on-surface-variant text-sm">
                      {courseName(item.courseId)}
                    </td>
                    <td className="px-6 py-4 border-t border-outline-variant/20 text-on-surface">
                      <strong className="block text-sm font-semibold">{date(item.startsOn)}</strong>
                      <span className="text-xs text-on-surface-variant mt-0.5 block">đến {date(item.endsOn)}</span>
                    </td>
                    <td className="px-6 py-4 border-t border-outline-variant/20 font-semibold text-on-surface">
                      {item.capacity}
                    </td>
                    <td className="px-6 py-4 border-t border-outline-variant/20">
                      <StatusBadge value={item.status}>{classStatusLabel[item.status]}</StatusBadge>
                    </td>
                    <td className="px-6 py-4 border-t border-outline-variant/20">
                      {item.defaultZoomUrl ? (
                        <a
                          href={item.defaultZoomUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-primary font-semibold text-sm hover:underline"
                        >
                          Mở link
                        </a>
                      ) : (
                        <span className="text-on-surface-variant">Chưa có</span>
                      )}
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
          title={editing ? "Cập nhật lớp học" : "Thêm lớp học"}
          description="Một lớp luôn thuộc một khóa học và có chu kỳ vận hành riêng."
          onClose={() => setOpen(false)}
        >
          <form className="space-y-4 flex flex-col h-full" onSubmit={save}>
            <div className="space-y-4 flex-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Khóa học</label>
                <select
                  required
                  disabled={!!editing}
                  {...field("courseId")}
                  className="px-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none disabled:bg-surface-container disabled:text-on-surface-variant transition-all"
                >
                  <option value="">Chọn khóa học</option>
                  {courses.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Mã lớp</label>
                  <input
                    required
                    disabled={!!editing}
                    {...field("code")}
                    className="px-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none disabled:bg-surface-container disabled:text-on-surface-variant transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Sức chứa</label>
                  <input
                    required
                    type="number"
                    min="1"
                    {...field("capacity")}
                    className="px-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tên lớp</label>
                <input
                  required
                  {...field("name")}
                  className="px-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Ngày bắt đầu</label>
                  <input
                    required
                    type="date"
                    {...field("startsOn")}
                    className="px-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Ngày kết thúc</label>
                  <input
                    type="date"
                    {...field("endsOn")}
                    className="px-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Trạng thái</label>
                <select
                  {...field("status")}
                  className="px-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                >
                  {Object.entries(classStatusLabel).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Link Zoom mặc định</label>
                <input
                  type="url"
                  {...field("defaultZoomUrl")}
                  placeholder="https://zoom.us/j/..."
                  className="px-4 py-2 border border-outline-variant/60 rounded-xl bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                />
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
                {saving ? "Đang lưu..." : "Lưu lớp học"}
              </button>
            </footer>
          </form>
        </Drawer>
      )}
    </section>
  );
}
