import {
  BookOpen, Check, Clock, Exam, FileText, MagnifyingGlass, SpinnerGap, X,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import type { Course, Page, SkillPair } from "../../academic-types";
import type {
  LearningResource, LibraryItem, LibrarySkill, TestBankItem, TestBankSummary,
} from "../../library-types";
import { isResource } from "../../library-types";
import { apiFetch } from "../../lib/api";

export type SessionPickerItem = LearningResource | TestBankSummary;

function isTestBankItem(value: LibraryItem | TestBankItem): value is TestBankItem {
  return "testType" in value;
}

type SessionItem = {
  itemType: "MATERIAL" | "ASSIGNMENT" | "TEST";
  title: string;
  description?: string | null;
  sourceAssignmentId?: string | null;
  sourceTestId?: string | null;
  sourceResourceId?: string | null;
  sourceExerciseTemplateId?: string | null;
  deadlineAt?: string | null;
  required?: boolean;
  visibility?: "STUDENT" | "TEACHER";
};

type CourseSession = {
  id: string; sessionNo: number; title: string | null; startsAt: string; endsAt: string;
  zoomMeetingId: string | null; zoomUrl: string | null; status: string; notes: string | null;
  phaseName: string | null; content: string | null; teacherId: string | null; items: SessionItem[];
};

type Props = {
  open?: boolean;
  item?: LibraryItem | TestBankItem;
  courses?: Course[];
  courseId?: string;
  skillPair?: SkillPair;
  onClose: () => void;
  onSuccess?: () => void;
  onAttach?: (items: SessionPickerItem[]) => void;
};

const inputClass = "min-h-11 w-full rounded-xl border border-outline-variant/50 bg-surface px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

const skillLabel: Record<SessionPickerItem["skill"], string> = {
  LISTENING: "Listening",
  READING: "Reading",
  WRITING: "Writing",
  SPEAKING: "Speaking",
  FULL_TEST: "Full test",
};

export default function AttachLibraryModal({
  open = true,
  item,
  courses = [],
  courseId = "",
  skillPair,
  onClose,
  onSuccess,
  onAttach,
}: Props) {
  const pickerMode = !item && Boolean(onAttach);
  const [selectedCourseId, setSelectedCourseId] = useState(courseId);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [sessions, setSessions] = useState<CourseSession[]>([]);
  const [pickerItems, setPickerItems] = useState<SessionPickerItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [kind, setKind] = useState<"ALL" | "MATERIAL" | "TEST">("ALL");
  const [skillFilter, setSkillFilter] = useState<"ALL" | LibrarySkill>("ALL");
  const [testTypeFilter, setTestTypeFilter] = useState<"ALL" | "SINGLE_SKILL" | "FULL_TEST">("ALL");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRequired, setIsRequired] = useState(true);
  const [visibility, setVisibility] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || pickerMode || !selectedCourseId) {
      if (!pickerMode) { setSessions([]); setSelectedSessionId(""); }
      return;
    }
    setLoading(true);
    setError("");
    void apiFetch<CourseSession[]>(`/admin/courses/${selectedCourseId}/sessions`)
      .then(result => {
        setSessions(result);
        setSelectedSessionId(current => result.some(session => session.id === current) ? current : result[0]?.id ?? "");
      })
      .catch(reason => setError(reason instanceof Error ? reason.message : "Không tải được danh sách buổi học."))
      .finally(() => setLoading(false));
  }, [open, pickerMode, selectedCourseId]);

  useEffect(() => {
    if (!open || !pickerMode) return;
    const resourceParams = new URLSearchParams({ size: "100", status: "PUBLISHED" });
    if (courseId) {
      resourceParams.set("courseId", courseId);
      resourceParams.set("includeGlobal", "true");
    }
    setLoading(true);
    setError("");
    setSelectedIds([]);
    setSkillFilter("ALL");
    setTestTypeFilter("ALL");
    const loadPickerItems = async () => {
      const [resources, firstTests] = await Promise.all([
        apiFetch<Page<LearningResource>>(`/admin/library/resources?${resourceParams}`),
        apiFetch<Page<TestBankSummary>>("/admin/test-bank?status=PUBLISHED&page=0&size=24"),
      ]);
      const otherTestPages = await Promise.all(Array.from(
        { length: Math.max(0, firstTests.totalPages - 1) },
        (_, index) => apiFetch<Page<TestBankSummary>>(`/admin/test-bank?status=PUBLISHED&page=${index + 1}&size=24`),
      ));
      setPickerItems([
        ...resources.content,
        ...firstTests.content,
        ...otherTestPages.flatMap(page => page.content),
      ]);
    };
    void loadPickerItems()
      .catch(reason => setError(reason instanceof Error ? reason.message : "Không tải được tài liệu và ngân hàng đề."))
      .finally(() => setLoading(false));
  }, [courseId, open, pickerMode]);

  const allowedSkills = useMemo<LibrarySkill[]>(() => skillPair === "LISTENING_READING"
    ? ["LISTENING", "READING"]
    : skillPair === "SPEAKING_WRITING" ? ["SPEAKING", "WRITING"] : [], [skillPair]);
  const eligibleItems = useMemo(() => pickerItems.filter(value => (
    value.skill !== "FULL_TEST" && (!allowedSkills.length || allowedSkills.includes(value.skill))
  )), [allowedSkills, pickerItems]);
  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi-VN");
    return eligibleItems.filter(value => {
      const test = "testType" in value;
      if (kind === "MATERIAL" && test) return false;
      if (kind === "TEST" && !test) return false;
      if (skillFilter !== "ALL" && value.skill !== skillFilter) return false;
      if (testTypeFilter !== "ALL" && (!test || value.testType !== testTypeFilter)) return false;
      const searchText = test
        ? `${value.code} ${value.title} ${value.skill} ${value.tags.join(" ")}`
        : `${value.code} ${value.title} ${value.skill} ${value.category}`;
      return !normalizedQuery || searchText.toLocaleLowerCase("vi-VN").includes(normalizedQuery);
    });
  }, [eligibleItems, kind, query, skillFilter, testTypeFilter]);
  const pickerCounts = useMemo(() => ({
    ALL: eligibleItems.length,
    MATERIAL: eligibleItems.filter(value => !("testType" in value)).length,
    TEST: eligibleItems.filter(value => "testType" in value).length,
  }), [eligibleItems]);
  const hasActiveFilters = Boolean(query.trim() || kind !== "ALL" || skillFilter !== "ALL" || testTypeFilter !== "ALL");

  function resetPickerFilters() {
    setQuery("");
    setKind("ALL");
    setSkillFilter("ALL");
    setTestTypeFilter("ALL");
  }

  function confirmPicker() {
    const selected = pickerItems.filter(value => selectedIds.includes(value.id));
    if (!selected.length) {
      setError("Chọn ít nhất một tài liệu hoặc đề luyện tập để thêm vào buổi học.");
      return;
    }
    onAttach?.(selected);
    onClose();
  }

  async function handleDirectAttach() {
    if (!item || !selectedCourseId || !selectedSessionId) {
      setError("Vui lòng chọn khóa học và buổi học cần gắn.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const session = sessions.find(value => value.id === selectedSessionId);
      if (!session) throw new Error("Buổi học đã chọn không còn tồn tại.");
      const isTest = isTestBankItem(item);
      const isExercise = "exerciseType" in item;
      const newItem: SessionItem = {
        itemType: isTest ? "TEST" : isExercise ? "ASSIGNMENT" : "MATERIAL",
        title: item.title,
        description: "description" in item ? item.description : "instructions" in item ? item.instructions : null,
        sourceTestId: isTest ? item.id : null,
        sourceResourceId: !isTest && isResource(item as LibraryItem) ? item.id : null,
        sourceExerciseTemplateId: isExercise ? item.id : null,
        required: isRequired,
        visibility,
      };
      await apiFetch(`/admin/courses/${selectedCourseId}/sessions/${selectedSessionId}`, {
        method: "PUT",
        body: JSON.stringify({
          sessionNo: session.sessionNo, title: session.title, startsAt: session.startsAt, endsAt: session.endsAt,
          zoomMeetingId: session.zoomMeetingId, zoomUrl: session.zoomUrl, status: session.status,
          notes: session.notes, phaseName: session.phaseName, content: session.content,
          teacherId: session.teacherId, items: [...(session.items ?? []), newItem],
        }),
      });
      onSuccess?.();
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể gắn học liệu vào buổi học.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  if (pickerMode) {
    return (
      <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="library-picker-title">
        <section className="flex max-h-[88dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface shadow-2xl">
          <header className="flex items-start justify-between border-b border-outline-variant/30 px-5 py-4">
            <div className="flex gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><BookOpen size={21} weight="duotone" /></span>
              <div><h3 id="library-picker-title" className="font-display text-lg font-extrabold text-on-surface">Thêm tài liệu hoặc đề luyện tập</h3><p className="mt-0.5 text-xs text-on-surface-variant">Đề bài lẻ và full test được lấy trực tiếp từ Ngân hàng đề.</p></div>
            </div>
            <button type="button" onClick={onClose} aria-label="Đóng" className="grid h-9 w-9 place-items-center rounded-xl border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container"><X size={18} /></button>
          </header>

          <div className="border-b border-outline-variant/25 bg-surface-container-low/25 px-5 py-3.5">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <label className="relative"><MagnifyingGlass size={18} className="absolute left-3 top-3 text-on-surface-variant"/><span className="sr-only">Tìm tài liệu hoặc đề</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm nhanh theo tên, mã đề hoặc kỹ năng..." className={`${inputClass} pl-10`} /></label>
              <div className="flex rounded-xl border border-outline-variant/30 bg-surface p-1" role="group" aria-label="Loại nội dung">
                {([["ALL", "Tất cả"], ["MATERIAL", "Tài liệu"], ["TEST", "Đề luyện tập"]] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={kind === value} onClick={() => { setKind(value); if (value === "MATERIAL") setTestTypeFilter("ALL"); }} className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition ${kind === value ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"}`}><span>{label}</span><span className={`rounded-full px-1.5 py-0.5 text-[10px] ${kind === value ? "bg-on-primary/15" : "bg-surface-container"}`}>{pickerCounts[value]}</span></button>)}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">Kỹ năng</span>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Lọc kỹ năng">
                {(["ALL", ...allowedSkills] as const).map(skill => <button key={skill} type="button" aria-pressed={skillFilter === skill} onClick={() => setSkillFilter(skill)} className={`min-h-8 rounded-lg border px-2.5 text-[11px] font-bold transition ${skillFilter === skill ? "border-primary bg-primary/10 text-primary" : "border-outline-variant/40 bg-surface text-on-surface-variant hover:border-primary/40"}`}>{skill === "ALL" ? "Tất cả" : skillLabel[skill]}</button>)}
              </div>
              {kind !== "MATERIAL" && <><span className="ml-1 hidden h-6 w-px bg-outline-variant/50 sm:block"/><span className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">Cấu trúc</span><div className="flex flex-wrap gap-1.5" role="group" aria-label="Lọc cấu trúc đề">{([['ALL', 'Tất cả'], ['SINGLE_SKILL', 'Bài lẻ'], ['FULL_TEST', 'Full đề']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={testTypeFilter === value} onClick={() => setTestTypeFilter(value)} className={`min-h-8 rounded-lg border px-2.5 text-[11px] font-bold transition ${testTypeFilter === value ? "border-primary bg-primary/10 text-primary" : "border-outline-variant/40 bg-surface text-on-surface-variant hover:border-primary/40"}`}>{label}</button>)}</div></>}
              {hasActiveFilters && <button type="button" onClick={resetPickerFilters} className="ml-auto min-h-8 px-1 text-[11px] font-bold text-primary hover:underline">Đặt lại bộ lọc</button>}
            </div>
          </div>

          <div className="min-h-44 flex-1 overflow-y-auto bg-surface-container-low/15 p-4">
            {error && <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">{error}</p>}
            {loading ? <div className="grid gap-3 sm:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-xl border border-outline-variant/25 bg-surface"><div className="m-4 h-3 w-20 rounded bg-surface-container-high"/><div className="mx-4 mt-5 h-4 w-3/5 rounded bg-surface-container-high"/><div className="mx-4 mt-3 h-3 w-2/5 rounded bg-surface-container"/></div>)}</div> : visibleItems.length ? (
              <><div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold text-on-surface">{visibleItems.length} nội dung phù hợp</p><p className="text-[11px] text-on-surface-variant">Chỉ hiển thị nội dung đã xuất bản</p></div><div className="grid gap-3 sm:grid-cols-2">
                {visibleItems.map(value => {
                  const selected = selectedIds.includes(value.id);
                  const test = "testType" in value;
                  return <button key={value.id} type="button" aria-pressed={selected} aria-label={`${selected ? "Bỏ chọn" : "Chọn"} ${value.title}`} onClick={() => setSelectedIds(current => selected ? current.filter(id => id !== value.id) : [...current, value.id])} className={`group relative min-h-32 rounded-xl border bg-surface p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-primary/25 ${selected ? "border-primary ring-1 ring-primary/20" : "border-outline-variant/35 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-sm"}`}>
                    <span className="flex items-start gap-3"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${test ? "bg-primary/10 text-primary" : "bg-sky-50 text-sky-700"}`}>{test ? <Exam size={20} weight="duotone"/> : <FileText size={20} weight="duotone"/>}</span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="rounded-md bg-surface-container px-2 py-1 font-mono text-[10px] font-bold text-on-surface-variant">{value.code}</span><span className="rounded-md border border-primary/15 bg-primary/5 px-2 py-1 text-[10px] font-bold text-primary">{skillLabel[value.skill]}</span><span className={`ml-auto grid h-6 w-6 shrink-0 place-items-center rounded-full border transition ${selected ? "border-primary bg-primary text-on-primary" : "border-outline-variant/60 text-transparent group-hover:border-primary/50"}`}><Check size={13} weight="bold"/></span></span><strong className="mt-2 block text-sm leading-snug text-on-surface">{value.title}</strong>{test ? <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-on-surface-variant"><span>{value.testType === "FULL_TEST" ? "Full đề" : "Bài lẻ"}</span><span className="inline-flex items-center gap-1"><FileText size={13}/>{value.totalQuestions} câu</span><span className="inline-flex items-center gap-1"><Clock size={13}/>{value.durationMinutes} phút</span></span> : <span className="mt-2 block text-[11px] font-semibold text-on-surface-variant">Tài liệu · {value.category}</span>}</span></span>
                  </button>;
                })}
              </div></>
            ) : <div className="grid min-h-44 place-items-center text-center"><div><BookOpen size={32} className="mx-auto text-outline"/><p className="mt-3 text-sm font-bold text-on-surface">Không có nội dung phù hợp</p><p className="mt-1 text-xs text-on-surface-variant">Thử đổi từ khóa, kỹ năng hoặc cấu trúc đề.</p>{hasActiveFilters && <button type="button" onClick={resetPickerFilters} className="mt-3 min-h-9 rounded-lg border border-primary/30 px-3 text-xs font-bold text-primary hover:bg-primary/5">Xóa bộ lọc</button>}</div></div>}
          </div>

          <footer className="flex flex-col gap-3 border-t border-outline-variant/30 bg-surface px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"><span><strong className={`block text-xs ${selectedIds.length ? "text-primary" : "text-on-surface"}`}>{selectedIds.length ? `${selectedIds.length} mục đã chọn` : "Chưa chọn nội dung"}</strong><span className="mt-0.5 block text-[11px] text-on-surface-variant">Các mục sẽ được thêm vào bản nháp của buổi học.</span></span><div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="min-h-10 rounded-xl border border-outline-variant/50 px-4 text-xs font-bold hover:bg-surface-container">Hủy</button><button type="button" disabled={!selectedIds.length} onClick={confirmPicker} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-on-primary transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"><Check size={16}/>Thêm vào buổi học{selectedIds.length ? ` (${selectedIds.length})` : ""}</button></div></footer>
        </section>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <section className="w-full max-w-lg space-y-5 rounded-2xl border border-outline-variant/30 bg-surface p-6 shadow-2xl">
        <header className="flex items-center justify-between border-b border-outline-variant/30 pb-3"><div><h3 className="font-display text-lg font-bold text-on-surface">Gắn vào buổi học</h3><p className="text-xs text-on-surface-variant">Chọn khóa học và buổi nhận học liệu</p></div><button type="button" onClick={onClose} aria-label="Đóng" className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container"><X size={20}/></button></header>
        {item && <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5"><span className="text-[11px] font-bold text-primary">{item.code}</span><h4 className="font-display text-sm font-bold text-on-surface">{item.title}</h4></div>}
        {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">{error}</p>}
        <div className="space-y-4">
          <label className="block"><span className="mb-1 block text-xs font-bold">Khóa học</span><select value={selectedCourseId} onChange={event => setSelectedCourseId(event.target.value)} className={inputClass}><option value="">Chọn khóa học</option>{courses.map(value => <option key={value.id} value={value.id}>{value.name} ({value.code})</option>)}</select></label>
          <label className="block"><span className="mb-1 block text-xs font-bold">Buổi học</span><select value={selectedSessionId} onChange={event => setSelectedSessionId(event.target.value)} disabled={!selectedCourseId || loading} className={inputClass}><option value="">{loading ? "Đang tải..." : "Chọn buổi học"}</option>{sessions.map(value => <option key={value.id} value={value.id}>Session {value.sessionNo}{value.title ? ` · ${value.title}` : ""}</option>)}</select></label>
          <div className="grid grid-cols-2 gap-3"><label><span className="mb-1 block text-xs font-bold">Yêu cầu</span><select value={isRequired ? "YES" : "NO"} onChange={event => setIsRequired(event.target.value === "YES")} className={inputClass}><option value="YES">Bắt buộc</option><option value="NO">Tùy chọn</option></select></label><label><span className="mb-1 block text-xs font-bold">Hiển thị</span><select value={visibility} onChange={event => setVisibility(event.target.value as "STUDENT" | "TEACHER")} className={inputClass}><option value="STUDENT">Học viên & giáo viên</option><option value="TEACHER">Chỉ giáo viên</option></select></label></div>
        </div>
        <footer className="flex justify-end gap-2 border-t border-outline-variant/30 pt-4"><button type="button" onClick={onClose} className="min-h-10 rounded-xl border border-outline-variant/50 px-4 text-xs font-bold">Hủy</button><button type="button" onClick={() => void handleDirectAttach()} disabled={submitting} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-5 text-xs font-bold text-on-primary disabled:opacity-50">{submitting ? <SpinnerGap size={16} className="animate-spin"/> : <Check size={16}/>}Gắn học liệu</button></footer>
      </section>
    </div>
  );
}
