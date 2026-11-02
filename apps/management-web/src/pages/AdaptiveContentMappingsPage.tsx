import {
  ArrowLeft,
  BookOpenText,
  LinkSimple,
  NotePencil,
  Plus,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/AdminUi";
import { apiFetch } from "../lib/api";

type TargetType = "PRACTICE_FILTER" | "TEST_VERSION" | "EXERCISE_TEMPLATE" | "LEARNING_RESOURCE";
type Difficulty = "" | "EASY" | "MEDIUM" | "HARD";

interface ContentMappingsResponse {
  enabled: boolean;
  components: ComponentOption[];
  mappings: ContentMapping[];
}

interface ComponentOption {
  code: string;
  name: string;
  skill: string;
  active: boolean;
}

interface ContentMapping {
  id: string;
  componentCode: string;
  componentName: string;
  targetType: TargetType;
  targetId: string | null;
  title: string;
  href: string;
  durationMinutes: number | null;
  difficulty: Exclude<Difficulty, ""> | null;
  priority: number;
  active: boolean;
}

interface MappingForm {
  componentCode: string;
  targetType: TargetType;
  targetId: string;
  title: string;
  href: string;
  durationMinutes: string;
  difficulty: Difficulty;
  priority: string;
  active: boolean;
}

const emptyForm: MappingForm = {
  componentCode: "",
  targetType: "PRACTICE_FILTER",
  targetId: "",
  title: "",
  href: "",
  durationMinutes: "15",
  difficulty: "MEDIUM",
  priority: "0",
  active: true,
};

const targetLabels: Record<TargetType, string> = {
  PRACTICE_FILTER: "Bộ lọc luyện tập",
  TEST_VERSION: "Phiên bản đề",
  EXERCISE_TEMPLATE: "Mẫu bài tập",
  LEARNING_RESOURCE: "Học liệu",
};

const fieldClass = "mt-2 min-h-11 w-full rounded-xl border border-outline-variant/60 bg-surface px-3 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export function AdaptiveContentMappingsPage() {
  const [data, setData] = useState<ContentMappingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [componentFilter, setComponentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MappingForm>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await apiFetch<ContentMappingsResponse>("/admin/adaptive-learning/content-mappings"));
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không tải được content mapping");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const mappings = useMemo(() => (data?.mappings ?? []).filter((mapping) => (
    (!componentFilter || mapping.componentCode === componentFilter)
    && (statusFilter === "ALL" || mapping.active === (statusFilter === "ACTIVE"))
  )), [componentFilter, data, statusFilter]);

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, componentCode: data?.components.find((item) => item.active)?.code ?? "" });
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(mapping: ContentMapping) {
    setEditingId(mapping.id);
    setForm({
      componentCode: mapping.componentCode,
      targetType: mapping.targetType,
      targetId: mapping.targetId ?? "",
      title: mapping.title,
      href: mapping.href,
      durationMinutes: mapping.durationMinutes?.toString() ?? "",
      difficulty: mapping.difficulty ?? "",
      priority: mapping.priority.toString(),
      active: mapping.active,
    });
    setFormError("");
    setFormOpen(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        componentCode: form.componentCode,
        targetType: form.targetType,
        targetId: form.targetId || null,
        title: form.title,
        href: form.href,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : null,
        difficulty: form.difficulty || null,
        priority: form.priority ? Number(form.priority) : 0,
        active: form.active,
      };
      const saved = await apiFetch<ContentMapping>(
        `/admin/adaptive-learning/content-mappings${editingId ? `/${editingId}` : ""}`,
        { method: editingId ? "PUT" : "POST", body: JSON.stringify(payload) },
      );
      setData((current) => current && ({
        ...current,
        mappings: editingId
          ? current.mappings.map((item) => item.id === saved.id ? saved : item)
          : [saved, ...current.mappings],
      }));
      setFormOpen(false);
    } catch (value) {
      setFormError(value instanceof Error ? value.message : "Không lưu được mapping");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-[1440px] space-y-6">
      <PageHeader
        eyebrow="AI & CÁ NHÂN HÓA"
        title="Học liệu cho AI"
        description="Liên kết knowledge component với hoạt động mà engine có thể đề xuất cho học viên."
        action={(
          <div className="flex flex-wrap gap-2">
            <Link to="/adaptive-learning" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-outline-variant/60 bg-surface px-4 text-sm font-bold text-on-surface hover:bg-surface-container">
              <ArrowLeft size={17} /> Tổng quan
            </Link>
            <button type="button" onClick={openCreate} disabled={!data?.components.length} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-on-primary disabled:cursor-not-allowed disabled:opacity-50">
              <Plus size={17} /> Thêm mapping
            </button>
          </div>
        )}
      />

      {error ? <ErrorState message={error} retry={() => void load()} /> : null}
      {loading ? <Skeleton /> : null}

      {data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Summary label="Tổng mapping" value={data.mappings.length} />
            <Summary label="Đang hoạt động" value={data.mappings.filter((item) => item.active).length} />
            <Summary label="Component chưa có học liệu" value={data.components.filter((component) => !data.mappings.some((mapping) => mapping.active && mapping.componentCode === component.code)).length} warning />
          </div>

          {formOpen ? (
            <MappingEditor
              components={data.components}
              editing={Boolean(editingId)}
              form={form}
              saving={saving}
              error={formError}
              setForm={setForm}
              close={() => setFormOpen(false)}
              submit={submit}
            />
          ) : null}

          <div className="flex flex-col gap-3 rounded-2xl border border-outline-variant/40 bg-surface p-4 sm:flex-row">
            <label className="flex-1 text-sm font-semibold text-on-surface-variant">
              Knowledge component
              <select value={componentFilter} onChange={(event) => setComponentFilter(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-outline-variant/60 bg-surface px-3 text-on-surface focus:border-primary focus:ring-primary/20">
                <option value="">Tất cả component</option>
                {data.components.map((component) => <option key={component.code} value={component.code}>{component.name}</option>)}
              </select>
            </label>
            <label className="sm:w-56 text-sm font-semibold text-on-surface-variant">
              Trạng thái
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="mt-2 min-h-11 w-full rounded-xl border border-outline-variant/60 bg-surface px-3 text-on-surface focus:border-primary focus:ring-primary/20">
                <option value="ALL">Tất cả</option><option value="ACTIVE">Đang hoạt động</option><option value="INACTIVE">Đã tắt</option>
              </select>
            </label>
          </div>

          {mappings.length === 0 ? (
            <div className="rounded-2xl border border-outline-variant/40 bg-surface p-10 text-center">
              <BookOpenText size={32} className="mx-auto text-primary" />
              <h2 className="mt-3 font-display text-lg font-bold text-on-surface">Chưa có mapping phù hợp</h2>
              <p className="mt-2 text-sm text-on-surface-variant">Thêm học liệu để engine có thể biến kết quả phân tích thành hoạt động tiếp theo.</p>
              <button type="button" onClick={openCreate} disabled={!data.components.length} className="mt-5 min-h-11 cursor-pointer rounded-xl bg-primary px-4 text-sm font-bold text-on-primary disabled:cursor-not-allowed disabled:opacity-50">Thêm mapping đầu tiên</button>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {mappings.map((mapping) => <MappingCard key={mapping.id} mapping={mapping} edit={() => openEdit(mapping)} />)}
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}

function MappingEditor({ components, editing, form, saving, error, setForm, close, submit }: {
  components: ComponentOption[];
  editing: boolean;
  form: MappingForm;
  saving: boolean;
  error: string;
  setForm: (value: MappingForm) => void;
  close: () => void;
  submit: (event: FormEvent) => void;
}) {
  return (
    <form onSubmit={submit} className="rounded-2xl border border-primary/25 bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div><h2 className="font-display text-lg font-bold text-on-surface">{editing ? "Chỉnh sửa mapping" : "Thêm content mapping"}</h2><p className="mt-1 text-sm text-on-surface-variant">Đường dẫn phải mở được trong Main Web.</p></div>
        <button type="button" onClick={close} aria-label="Đóng biểu mẫu" className="grid min-h-11 min-w-11 cursor-pointer place-items-center rounded-xl text-on-surface-variant hover:bg-surface-container"><X size={20} /></button>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Knowledge component *"><select required value={form.componentCode} onChange={(event) => setForm({ ...form, componentCode: event.target.value })} className={fieldClass}><option value="">Chọn component</option>{components.map((item) => <option key={item.code} value={item.code} disabled={!item.active}>{item.name}{item.active ? "" : " (đã tắt)"}</option>)}</select></Field>
        <Field label="Loại đích"><select value={form.targetType} onChange={(event) => setForm({ ...form, targetType: event.target.value as TargetType })} className={fieldClass}>{Object.entries(targetLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
        <Field label="Tiêu đề *"><input required maxLength={240} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={fieldClass} /></Field>
        <Field label="Đường dẫn Main Web *"><input required pattern="(/|https?://).+" maxLength={1000} placeholder="/student/practice?..." value={form.href} onChange={(event) => setForm({ ...form, href: event.target.value })} className={fieldClass} /></Field>
        {form.targetType !== "PRACTICE_FILTER" ? <Field label="Target UUID (nếu có)"><input pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}" value={form.targetId} onChange={(event) => setForm({ ...form, targetId: event.target.value })} className={fieldClass} /></Field> : null}
        <Field label="Thời lượng (phút)"><input type="number" min="1" max="480" value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: event.target.value })} className={fieldClass} /></Field>
        <Field label="Độ khó"><select value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value as Difficulty })} className={fieldClass}><option value="">Không xác định</option><option value="EASY">Dễ</option><option value="MEDIUM">Trung bình</option><option value="HARD">Khó</option></select></Field>
        <Field label="Độ ưu tiên"><input type="number" min="-100" max="100" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })} className={fieldClass} /></Field>
      </div>
      <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-on-surface"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} className="rounded border-outline-variant text-primary focus:ring-primary" />Cho phép engine sử dụng mapping này</label>
      {error ? <p role="alert" className="mt-3 text-sm font-semibold text-error">{error}</p> : null}
      <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={close} className="min-h-11 cursor-pointer rounded-xl border border-outline-variant/60 px-4 text-sm font-bold text-on-surface">Hủy</button><button type="submit" disabled={saving} className="min-h-11 cursor-pointer rounded-xl bg-primary px-5 text-sm font-bold text-on-primary disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Đang lưu" : "Lưu mapping"}</button></div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="text-sm font-semibold text-on-surface-variant">{label}{children}</label>;
}

function MappingCard({ mapping, edit }: { mapping: ContentMapping; edit: () => void }) {
  return <article className="rounded-2xl border border-outline-variant/40 bg-surface p-5"><div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-lg font-bold text-on-surface">{mapping.title}</h2><span className={`rounded-full px-2 py-1 text-xs font-bold ${mapping.active ? "bg-emerald-50 text-emerald-700" : "bg-surface-container text-on-surface-variant"}`}>{mapping.active ? "Đang hoạt động" : "Đã tắt"}</span></div><p className="mt-1 text-sm font-semibold text-primary">{mapping.componentName}</p></div><button type="button" onClick={edit} aria-label={`Chỉnh sửa ${mapping.title}`} className="grid min-h-11 min-w-11 cursor-pointer place-items-center rounded-xl border border-outline-variant/60 text-on-surface hover:bg-surface-container"><NotePencil size={18} /></button></div><dl className="mt-5 grid grid-cols-2 gap-3 text-sm"><Meta label="Loại" value={targetLabels[mapping.targetType]} /><Meta label="Độ khó" value={mapping.difficulty ?? "Chưa đặt"} /><Meta label="Thời lượng" value={mapping.durationMinutes ? `${mapping.durationMinutes} phút` : "Chưa đặt"} /><Meta label="Ưu tiên" value={mapping.priority.toString()} /></dl><div title={mapping.href} className="mt-5 flex min-h-11 items-center gap-2 overflow-hidden text-sm font-bold text-primary"><LinkSimple size={17} className="shrink-0" /><code className="truncate">{mapping.href}</code></div></article>;
}

function Meta({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-surface-container p-3"><dt className="text-xs font-semibold text-on-surface-variant">{label}</dt><dd className="mt-1 font-bold text-on-surface">{value}</dd></div>; }
function Summary({ label, value, warning = false }: { label: string; value: number; warning?: boolean }) { return <div className="rounded-2xl border border-outline-variant/40 bg-surface p-5"><p className="text-sm font-semibold text-on-surface-variant">{label}</p><strong className={`mt-2 block font-display text-3xl ${warning && value > 0 ? "text-amber-700" : "text-on-surface"}`}>{value}</strong></div>; }
function ErrorState({ message, retry }: { message: string; retry: () => void }) { return <div role="alert" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-error/20 bg-error-container/10 p-4 text-error"><span className="flex items-center gap-2 text-sm font-semibold"><WarningCircle size={22} />{message}</span><button type="button" onClick={retry} className="min-h-11 rounded-xl border border-error/30 px-4 text-sm font-bold">Thử lại</button></div>; }
function Skeleton() { return <div className="grid gap-4 lg:grid-cols-2" aria-label="Đang tải content mapping"><div className="h-52 animate-pulse rounded-2xl bg-surface" /><div className="h-52 animate-pulse rounded-2xl bg-surface" /></div>; }
