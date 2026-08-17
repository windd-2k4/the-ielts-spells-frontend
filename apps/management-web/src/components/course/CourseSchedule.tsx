import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowsOut, BookOpen, CalendarBlank, CaretLeft, CaretRight, Check, Clock,
  Exam, GearSix, List, NotePencil, Plus, Printer, SpinnerGap, Trash, VideoCamera,
  WarningCircle, X,
} from "@phosphor-icons/react";
import type {
  ClassSession, SessionItemType, SessionStatus, SkillPair, TeacherOption,
} from "../../academic-types";
import { useAuth } from "../../auth/AuthContext";
import { apiFetch } from "../../lib/api";
import ScheduleSetupModal from "./ScheduleSetupModal";
import SessionDrawer from "./SessionDrawer";
import AttachLibraryModal from "../library/AttachLibraryModal";
import type { LibraryItem } from "../../library-types";
import { isResource } from "../../library-types";

interface CourseScheduleProps { courseId: string; skillPair: SkillPair }
type ScheduleType = "ALL" | "CLASS" | "EXAM";
type ViewMode = "LIST" | "CALENDAR";
export type ItemDraft = {
  id?: string; itemType: SessionItemType; title: string;
  description: string; deadlineAt: string; sourceResourceId?: string;
  sourceExerciseTemplateId?: string; required: boolean;
  visibility: "STUDENT" | "TEACHER";
};
export type SessionDraft = {
  sessionNo: string; title: string; phaseName: string; content: string;
  startsAt: string; endsAt: string; teacherId: string; zoomUrl: string;
  zoomMeetingId: string; status: SessionStatus; notes: string; items: ItemDraft[];
};

const ROADMAP: Record<number, { phase: string; title: string; content: string }> = {
  1: { phase: "Giai đoạn 1 · Nắm vững chiến thuật", title: "Multiple Choice (P1) & Gap-filling / T-F-NG (P1)", content: "Listening: Multiple Choice (P1). Reading: Gap-filling và True/False/Not Given (P1)." },
  2: { phase: "Giai đoạn 1 · Nắm vững chiến thuật", title: "Multiple Choice (P2) & Gap-filling / T-F-NG (P2)", content: "Listening: Multiple Choice (P2). Reading: Gap-filling và True/False/Not Given (P2)." },
  3: { phase: "Giai đoạn 1 · Nắm vững chiến thuật", title: "Map-Labelling (P1) & Matching Headings (P1)", content: "Listening: Map-Labelling (P1). Reading: Matching Headings (P1)." },
  4: { phase: "Giai đoạn 1 · Nắm vững chiến thuật", title: "Map-Labelling (P2) & Matching Headings (P2)", content: "Listening: Map-Labelling (P2). Reading: Matching Headings (P2)." },
  5: { phase: "Giai đoạn 1 · Nắm vững chiến thuật", title: "Diagram / Flow-chart (P1) & Matching Information (P1)", content: "Listening: Diagram và Flow-chart (P1). Reading: Matching Information (P1)." },
  6: { phase: "Giai đoạn 1 · Nắm vững chiến thuật", title: "Diagram / Flow-chart (P2) & Matching Information (P2)", content: "Listening: Diagram và Flow-chart (P2). Reading: Matching Information (P2)." },
  7: { phase: "Giai đoạn 1 · Nắm vững chiến thuật", title: "Matching Features (P1) & Multiple Choice (P1)", content: "Listening: Matching Features (P1). Reading: Multiple Choice (P1)." },
  8: { phase: "Giai đoạn 1 · Nắm vững chiến thuật", title: "Matching Features (P2) & Multiple Choice (P2)", content: "Listening: Matching Features (P2). Reading: Multiple Choice (P2)." },
  9: { phase: "Giai đoạn 1 · Nắm vững chiến thuật", title: "Sentence Completion & Y-N-NG / Matching Endings", content: "Listening: Sentence Completion (P1). Reading: Yes/No/Not Given và Matching Endings." },
  10: { phase: "Giai đoạn 1 · Nắm vững chiến thuật", title: "Sentence Completion (P2) & Review", content: "Listening: Sentence Completion (P2). Reading: ôn tập và củng cố chiến thuật." },
  11: { phase: "Giai đoạn 1 · Nắm vững chiến thuật", title: "Practice Test Review", content: "Chữa Practice Test, phân tích nhóm lỗi và kế hoạch cải thiện cá nhân." },
  12: { phase: "Giai đoạn 2 · Luyện đề forecast", title: "Full Listening Practice Test", content: "Luyện đề Listening forecast, cải thiện tốc độ và độ chính xác." },
  13: { phase: "Giai đoạn 2 · Luyện đề forecast", title: "Full Reading Practice Test", content: "Luyện đề Reading forecast, cải thiện tốc độ và độ chính xác." },
  14: { phase: "Giai đoạn 2 · Luyện đề forecast", title: "Full Listening Practice Test", content: "Luyện đề Listening forecast và phân tích lỗi sai." },
  15: { phase: "Giai đoạn 2 · Luyện đề forecast", title: "Full Reading Practice Test", content: "Luyện đề Reading forecast và phân tích lỗi sai." },
  16: { phase: "Giai đoạn 2 · Luyện đề forecast", title: "Full Listening Practice Test", content: "Luyện đề Listening hoàn chỉnh trong điều kiện giới hạn thời gian." },
  17: { phase: "Giai đoạn 2 · Luyện đề forecast", title: "Full Reading Practice Test", content: "Luyện đề Reading hoàn chỉnh trong điều kiện giới hạn thời gian." },
  18: { phase: "Giai đoạn 2 · Luyện đề forecast", title: "Assessment Test", content: "Bài đánh giá cuối khóa, tổng hợp kết quả và đề xuất lộ trình tiếp theo." },
};

const pad = (value: number) => String(value).padStart(2, "0");
function toLocalInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function plusDays(value: string, days: number) {
  if (!value) return "";
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return toLocalInput(date.toISOString());
}
function emptyDraft(nextNo: number): SessionDraft {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  const end = new Date(start);
  end.setHours(end.getHours() + 2);
  return {
    sessionNo: String(nextNo), title: "", phaseName: "", content: "",
    startsAt: toLocalInput(start.toISOString()), endsAt: toLocalInput(end.toISOString()),
    teacherId: "", zoomUrl: "", zoomMeetingId: "", status: "SCHEDULED",
    notes: "", items: [],
  };
}
function fromSession(value: ClassSession): SessionDraft {
  return {
    sessionNo: String(value.sessionNo), title: value.title ?? "",
    phaseName: value.phaseName ?? "", content: value.content ?? "",
    startsAt: toLocalInput(value.startsAt), endsAt: toLocalInput(value.endsAt),
    teacherId: value.teacherId ?? "", zoomUrl: value.zoomUrl ?? "",
    zoomMeetingId: value.zoomMeetingId ?? "", status: value.status,
    notes: value.notes ?? "", items: (value.items ?? []).map(item => ({
      id: item.id, itemType: item.itemType, title: item.title,
      description: item.description ?? "", deadlineAt: toLocalInput(item.deadlineAt),
      sourceResourceId: item.sourceResourceId ?? undefined,
      sourceExerciseTemplateId: item.sourceExerciseTemplateId ?? undefined,
      required: item.required, visibility: item.visibility,
    })),
  };
}

export default function CourseSchedule({ courseId, skillPair }: CourseScheduleProps) {
  const { roles } = useAuth();
  const canManage = roles.some(role => role === "admin" || role === "manager");
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("CALENDAR");
  const [filterType, setFilterType] = useState<ScheduleType>("ALL");
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<SessionDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"SESSION" | "TEST">("SESSION");
  const [shiftFollowing, setShiftFollowing] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const values = await apiFetch<ClassSession[]>(`/admin/courses/${courseId}/sessions`);
      setSessions([...values].sort((a, b) => a.sessionNo - b.sessionNo));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không tải được thời khóa biểu.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!canManage) return;
    void apiFetch<TeacherOption[]>("/admin/teacher-options")
      .then(setTeachers).catch(() => setTeachers([]));
  }, [canManage]);

  const monday = useMemo(() => {
    const result = new Date(weekAnchor);
    const day = result.getDay();
    result.setHours(0, 0, 0, 0);
    result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
    return result;
  }, [weekAnchor]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const value = new Date(monday);
    value.setDate(monday.getDate() + index);
    return value;
  }), [monday]);
  const visibleSessions = useMemo(() => sessions.filter(session => {
    if (filterType === "EXAM") return session.items?.some(item => item.itemType === "TEST");
    if (filterType === "CLASS") return !session.items?.some(item => item.itemType === "TEST");
    return true;
  }), [filterType, sessions]);

  function openCreate(day?: Date, slot?: "MORNING" | "AFTERNOON" | "EVENING", mode: "SESSION" | "TEST" = "SESSION") {
    const value = emptyDraft(Math.max(0, ...sessions.map(item => item.sessionNo)) + 1);
    if (day) {
      const start = new Date(day);
      start.setHours(slot === "MORNING" ? 8 : slot === "AFTERNOON" ? 14 : 19, 0, 0, 0);
      const end = new Date(start);
      end.setHours(end.getHours() + 2);
      value.startsAt = toLocalInput(start.toISOString());
      value.endsAt = toLocalInput(end.toISOString());
    }
    setEditingId(null);
    setDrawerMode(mode);
    if (mode === "TEST") {
      const nextTestNo = sessions.filter(item => item.items?.some(child => child.itemType === "TEST")).length + 1;
      value.title = `Mini Test ${nextTestNo}`;
      value.items = [{ itemType: "TEST", title: value.title, description: "", deadlineAt: plusDays(value.endsAt, 2), required: true, visibility: "STUDENT" }];
    }
    setConfirmDelete(false);
    setDraft(value);
    setError("");
  }
  function openEdit(session: ClassSession) {
    setEditingId(session.id);
    setConfirmDelete(false);
    setDraft(fromSession(session));
    setDrawerMode(session.items?.some(item => item.itemType === "TEST") ? "TEST" : "SESSION");
    setShiftFollowing(false);
    setError("");
  }
  function patchDraft(patch: Partial<SessionDraft>) {
    setDraft(current => current ? { ...current, ...patch } : current);
  }
  function applyRoadmap() {
    if (!draft) return;
    const sample = ROADMAP[Number(draft.sessionNo)];
    if (!sample) {
      setError("Lộ trình mẫu hiện có từ buổi 01 đến buổi 18.");
      return;
    }
    patchDraft({ phaseName: sample.phase, title: sample.title, content: sample.content });
    setError("");
  }
  function addItem(type: SessionItemType) {
    if (!draft || (type !== "MATERIAL" && draft.items.filter(item => item.itemType !== "MATERIAL").length >= 10)) return;
    patchDraft({ items: [...draft.items, {
      itemType: type, title: type === "TEST" ? "Bài test" : type === "MATERIAL" ? "Tài liệu buổi học" : "Bài tập",
      description: "", deadlineAt: type === "MATERIAL" ? "" : plusDays(draft.endsAt, 2),
      required: type !== "MATERIAL", visibility: "STUDENT",
    }] });
  }
  function attachLibrary(items: LibraryItem[]) {
    if (!draft) return;
    const exerciseCount = draft.items.filter(item => item.itemType !== "MATERIAL").length;
    let remaining = Math.max(0, 10 - exerciseCount);
    const additions: ItemDraft[] = [];
    items.forEach(item => {
      if (isResource(item)) {
        additions.push({ itemType: "MATERIAL", title: item.title, description: item.description ?? item.externalUrl ?? "",
          deadlineAt: "", sourceResourceId: item.id, required: false,
          visibility: item.teacherOnly ? "TEACHER" : "STUDENT" });
      } else if (remaining > 0) {
        additions.push({ itemType: "ASSIGNMENT", title: item.title, description: item.instructions ?? item.sourceUrl ?? "",
          deadlineAt: plusDays(draft.endsAt, 2), sourceExerciseTemplateId: item.id,
          required: true, visibility: "STUDENT" });
        remaining -= 1;
      }
    });
    patchDraft({ items: [...draft.items, ...additions] });
    if (items.some(item => !isResource(item)) && remaining === 0 && additions.filter(value => value.itemType === "ASSIGNMENT").length < items.filter(value => !isResource(value)).length) {
      setError("Session chỉ nhận tối đa 10 bài tập/bài test. Tài liệu không bị giới hạn.");
    }
  }
  function patchItem(index: number, patch: Partial<ItemDraft>) {
    if (!draft) return;
    patchDraft({ items: draft.items.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...patch } : item) });
  }
  function removeItem(index: number) {
    if (draft) patchDraft({ items: draft.items.filter((_, itemIndex) => itemIndex !== index) });
  }

  async function save() {
    if (!draft) return;
    if (!draft.sessionNo || !draft.startsAt || !draft.endsAt) {
      setError("Vui lòng nhập số session, thời gian bắt đầu và kết thúc.");
      return;
    }
    if (drawerMode === "TEST" && !draft.title.trim()) {
      setError("Vui lòng nhập tên mini test.");
      return;
    }
    if (new Date(draft.endsAt) <= new Date(draft.startsAt)) {
      setError("Thời gian kết thúc phải sau thời gian bắt đầu.");
      return;
    }
    if (draft.items.some(item => !item.title.trim())) {
      setError("Mỗi tài liệu, bài tập hoặc bài test cần có tên.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body = {
        sessionNo: Number(draft.sessionNo), title: drawerMode === "TEST" ? draft.title : `Session ${Number(draft.sessionNo)}`,
        startsAt: new Date(draft.startsAt).toISOString(),
        endsAt: new Date(draft.endsAt).toISOString(),
        zoomMeetingId: draft.zoomMeetingId || null, zoomUrl: draft.zoomUrl || null,
        status: draft.status, notes: draft.notes || null,
        phaseName: draft.phaseName || null, content: draft.content || null,
        teacherId: draft.teacherId || null,
        items: draft.items.map((item, index) => ({
          itemType: item.itemType, title: item.title.trim(),
          description: item.description || null,
          deadlineAt: item.deadlineAt ? new Date(item.deadlineAt).toISOString() : null,
          sourceAssignmentId: null, sourceTestId: null, displayOrder: index,
          sourceResourceId: item.sourceResourceId ?? null,
          sourceExerciseTemplateId: item.sourceExerciseTemplateId ?? null,
          required: item.required, visibility: item.visibility,
        })),
      };
      await apiFetch(`/admin/courses/${courseId}/sessions${editingId ? `/${editingId}` : ""}`, {
        method: editingId ? "PUT" : "POST", body: JSON.stringify(body),
      });
      if (editingId && shiftFollowing) {
        const unique = new Map<string, { dayOfWeek: number; startsAt: string; endsAt: string }>();
        sessions.forEach(session => {
          const start = new Date(session.startsAt), end = new Date(session.endsAt);
          const dayOfWeek = start.getDay() === 0 ? 7 : start.getDay();
          const key = `${dayOfWeek}-${start.getHours()}-${start.getMinutes()}`;
          unique.set(key, { dayOfWeek, startsAt: `${pad(start.getHours())}:${pad(start.getMinutes())}`, endsAt: `${pad(end.getHours())}:${pad(end.getMinutes())}` });
        });
        await apiFetch(`/admin/courses/${courseId}/sessions/${editingId}/reschedule`, {
          method: "POST", body: JSON.stringify({ startsAt: body.startsAt, endsAt: body.endsAt, shiftFollowing: true, weeklySlots: [...unique.values()] }),
        });
      }
      const wasEditing = Boolean(editingId);
      setDraft(null);
      setNotice(wasEditing
        ? (drawerMode === "TEST" ? "Đã cập nhật mini test." : "Đã cập nhật buổi học.")
        : (drawerMode === "TEST" ? "Đã thêm mini test." : "Đã thêm buổi học."));
      await load();
      window.setTimeout(() => setNotice(""), 3000);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể lưu buổi học.");
    } finally {
      setSaving(false);
    }
  }

  async function removeSession() {
    if (!editingId) return;
    setSaving(true);
    setError("");
    try {
      await apiFetch(`/admin/courses/${courseId}/sessions/${editingId}`, { method: "DELETE" });
      setDraft(null);
      setNotice("Đã xóa buổi học.");
      await load();
      window.setTimeout(() => setNotice(""), 3000);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể xóa buổi học.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          <Check size={18} />{notice}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-outline-variant/40 bg-surface p-4 shadow-sm">
        <div className="flex items-center gap-1.5 rounded-xl border border-outline-variant/20 bg-surface-container-low p-1">
          <ViewButton active={viewMode === "CALENDAR"} onClick={() => setViewMode("CALENDAR")} icon={<CalendarBlank size={16} />} label="Lịch tuần trực quan" />
          <ViewButton active={viewMode === "LIST"} onClick={() => setViewMode("LIST")} icon={<List size={16} />} label="Dạng danh sách" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {(["ALL", "CLASS", "EXAM"] as const).map(value => (
            <label key={value} className="flex cursor-pointer items-center gap-1.5 text-xs font-bold text-on-surface-variant">
              <input type="radio" checked={filterType === value} onChange={() => setFilterType(value)} className="accent-primary" />
              {value === "ALL" ? "Tất cả" : value === "CLASS" ? "Lịch học" : "Bài test"}
            </label>
          ))}
          {viewMode === "CALENDAR" && <>
            <button onClick={() => setWeekAnchor(new Date())} className="rounded-lg border border-outline-variant/50 px-2.5 py-2 text-xs font-bold hover:bg-surface-container">Hiện tại</button>
            <button aria-label="Tuần trước" onClick={() => setWeekAnchor(value => new Date(value.getFullYear(), value.getMonth(), value.getDate() - 7))} className="rounded-lg border border-outline-variant/50 p-2"><CaretLeft size={16} /></button>
            <button aria-label="Tuần sau" onClick={() => setWeekAnchor(value => new Date(value.getFullYear(), value.getMonth(), value.getDate() + 7))} className="rounded-lg border border-outline-variant/50 p-2"><CaretRight size={16} /></button>
            <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-lg border border-outline-variant/50 px-3 py-2 text-xs font-bold"><Printer size={15} />In lịch</button>
            <button aria-label="Toàn màn hình" onClick={() => document.documentElement.requestFullscreen?.()} className="rounded-lg border border-outline-variant/50 p-2"><ArrowsOut size={16} /></button>
          </>}
          {canManage && (
            <><button onClick={() => setShowSetup(true)} className="flex items-center gap-2 rounded-xl border border-primary/30 px-4 py-2.5 text-sm font-extrabold text-primary"><GearSix size={18}/>Thiết lập lộ trình</button><button onClick={() => openCreate(undefined, undefined, "TEST")} className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-extrabold text-amber-900"><Exam size={18} weight="bold" />Thêm mini test</button><button onClick={() => openCreate()} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-extrabold text-on-primary shadow-sm hover:brightness-95"><Plus size={18} weight="bold" />Thêm buổi học</button></>
          )}
        </div>
      </div>

      {error && !draft && <ErrorPanel message={error} onRetry={() => void load()} />}
      {loading ? <LoadingPanel /> : !error && (viewMode === "CALENDAR"
        ? <CalendarView days={days} sessions={visibleSessions} canManage={canManage} onOpen={openEdit} onEmptyCell={openCreate} />
        : <ListView sessions={visibleSessions} canManage={canManage} onOpen={openEdit} onCreate={() => openCreate()} />)}

      {draft && (
        <SessionDrawer
          draft={draft}
          editingId={editingId}
          drawerMode={drawerMode}
          skillPair={skillPair}
          teachers={teachers}
          saving={saving}
          error={error}
          confirmDelete={confirmDelete}
          shiftFollowing={shiftFollowing}
          onClose={() => setDraft(null)}
          onPatchDraft={patchDraft}
          onApplyRoadmap={applyRoadmap}
          onAddItem={addItem}
          onOpenLibrary={() => setLibraryOpen(true)}
          onPatchItem={patchItem}
          onRemoveItem={removeItem}
          onSave={save}
          onRemoveSession={removeSession}
          onSetConfirmDelete={setConfirmDelete}
          onSetShiftFollowing={setShiftFollowing}
        />
      )}
      {showSetup && <ScheduleSetupModal courseId={courseId} skillPair={skillPair} teachers={teachers} onClose={()=>setShowSetup(false)} onApplied={load}/>} 
      <AttachLibraryModal open={libraryOpen} courseId={courseId} skillPair={skillPair} onClose={()=>setLibraryOpen(false)} onAttach={attachLibrary}/>
    </div>
  );
}

const inputClass = "w-full rounded-xl border border-outline-variant/60 bg-surface px-3 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10";
function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return <label className={wide ? "sm:col-span-2" : ""}><span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-on-surface-variant">{label}</span>{children}</label>;
}
function ViewButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return <button onClick={onClick} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${active ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}>{icon}{label}</button>;
}
function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-12 text-center"><WarningCircle className="mx-auto text-rose-700" size={30} /><p className="mt-3 font-extrabold text-rose-800">Không tải được dữ liệu</p><p className="mt-1 text-sm text-rose-700">{message}</p><button onClick={onRetry} className="mt-4 rounded-lg border border-rose-300 px-4 py-2 text-sm font-bold text-rose-800">Thử lại</button></div>;
}
function LoadingPanel() {
  return <div className="flex min-h-72 items-center justify-center rounded-2xl border border-outline-variant/40 bg-surface"><SpinnerGap className="animate-spin text-primary" size={30} /></div>;
}
function CalendarView({ days, sessions, canManage, onOpen, onEmptyCell }: { days: Date[]; sessions: ClassSession[]; canManage: boolean; onOpen: (session: ClassSession) => void; onEmptyCell: (day: Date, slot: "MORNING" | "AFTERNOON" | "EVENING") => void }) {
  const slots = [
    { key: "MORNING" as const, label: "Sáng", from: 0, to: 12 },
    { key: "AFTERNOON" as const, label: "Chiều", from: 12, to: 18 },
    { key: "EVENING" as const, label: "Tối", from: 18, to: 24 },
  ];
  return <div className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[980px] table-fixed border-collapse"><thead><tr className="border-b border-outline-variant/40 bg-surface-container-low"><th className="w-20 border-r border-outline-variant/20 px-3 py-4 text-xs font-extrabold uppercase text-on-surface-variant">Ca học</th>{days.map((day, index) => <th key={day.toISOString()} className="border-r border-outline-variant/20 px-3 py-4 text-center last:border-r-0"><p className="text-sm font-extrabold">{index === 6 ? "Chủ nhật" : `Thứ ${index + 2}`}</p><p className="mt-0.5 text-xs font-semibold text-on-surface-variant">{day.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}</p></th>)}</tr></thead><tbody>{slots.map(slot => <tr key={slot.key} className="h-40 border-b border-outline-variant/25 last:border-0"><td className="border-r border-outline-variant/20 bg-surface-container-low/20 text-center text-xs font-extrabold text-on-surface-variant">{slot.label}</td>{days.map(day => {
    const values = sessions.filter(session => {
      const start = new Date(session.startsAt);
      return start.toDateString() === day.toDateString() && start.getHours() >= slot.from && start.getHours() < slot.to;
    });
    return <td key={day.toISOString()} onDoubleClick={() => canManage && onEmptyCell(day, slot.key)} className="align-top border-r border-outline-variant/20 p-2 last:border-r-0">{values.map(session => <SessionCard key={session.id} session={session} onClick={() => canManage && onOpen(session)} />)}{values.length === 0 && canManage && <button onClick={() => onEmptyCell(day, slot.key)} className="flex h-full min-h-28 w-full items-center justify-center rounded-xl border border-dashed border-transparent text-outline/0 transition hover:border-primary/25 hover:text-primary/70"><Plus size={20} /></button>}</td>;
  })}</tr>)}</tbody></table></div><div className="flex flex-wrap items-center justify-center gap-5 border-t border-outline-variant/30 bg-surface-container-low px-5 py-4 text-xs font-semibold text-on-surface-variant"><span className="flex items-center gap-2"><i className="h-3 w-3 rounded bg-blue-100 ring-1 ring-blue-300" />Học trực tuyến (Zoom)</span><span className="flex items-center gap-2"><i className="h-3 w-3 rounded bg-amber-100 ring-1 ring-amber-300" />Có bài test</span><span className="flex items-center gap-2"><i className="h-3 w-3 rounded bg-rose-100 ring-1 ring-rose-300" />Đã hủy</span></div></div>;
}
function SessionCard({ session, onClick }: { session: ClassSession; onClick: () => void }) {
  const start = new Date(session.startsAt);
  const end = new Date(session.endsAt);
  const hasTest = session.items?.some(item => item.itemType === "TEST");
  const contents = (session.content ?? "").split("\n").map(value => value.trim()).filter(Boolean);
  const displayName = hasTest ? (session.title || "Mini Test") : `Session ${session.sessionNo}`;
  const tone = session.status === "CANCELLED" ? "border-rose-300 bg-rose-50 text-rose-900" : hasTest ? "border-amber-300 bg-amber-50 text-amber-950" : session.zoomUrl ? "border-blue-300 bg-blue-50 text-blue-950" : "border-primary/25 bg-primary/5 text-on-surface";
  return <button onClick={onClick} className={`mb-2 w-full rounded-xl border p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${tone}`}>
    <div className="flex items-start justify-between gap-2"><span className="text-[10px] font-black uppercase tracking-[.12em] opacity-70">{hasTest ? "Mini test" : `Buổi ${pad(session.sessionNo)}`}</span>{hasTest ? <Exam size={16} weight="fill" /> : session.zoomUrl ? <VideoCamera size={16} weight="fill" /> : <BookOpen size={16} weight="fill" />}</div>
    <p className="mt-1 line-clamp-1 text-xs font-extrabold">{displayName}</p>
    {contents.length > 0 && <p className="mt-1 line-clamp-2 text-[10px] font-semibold leading-4 opacity-80">{contents.slice(0, 2).join(" · ")}</p>}
    <div className="mt-2 space-y-1 border-t border-current/10 pt-2 text-[10px] font-bold opacity-80">
      <p className="flex items-center gap-1"><Clock size={11} />{start.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}–{end.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</p>
      <p className="truncate">GV: {session.teacherName || "Chưa phân công"}</p>
      <p className="flex items-center gap-1">{session.zoomUrl ? <><VideoCamera size={11} /> Có Zoom</> : "Chưa có link Zoom"}{!hasTest && session.items?.length > 0 && ` · ${session.items.length} bài tập`}</p>
    </div>
  </button>;
}
function ListView({ sessions, canManage, onOpen, onCreate }: { sessions: ClassSession[]; canManage: boolean; onOpen: (session: ClassSession) => void; onCreate: () => void }) {
  if (sessions.length === 0) return <div className="rounded-2xl border border-dashed border-outline-variant/70 bg-surface px-6 py-16 text-center"><CalendarBlank className="mx-auto text-primary/70" size={38} /><h3 className="mt-4 font-display text-xl font-extrabold">Chưa có buổi học</h3><p className="mt-2 text-sm text-on-surface-variant">Tạo buổi đầu tiên và áp dụng nhanh lộ trình Listening & Reading 18 buổi.</p>{canManage && <button onClick={onCreate} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-extrabold text-on-primary"><Plus size={18} />Thêm buổi học</button>}</div>;
  return <div className="overflow-x-auto rounded-2xl border border-outline-variant/40 bg-surface shadow-sm"><div className="min-w-[850px]"><div className="grid grid-cols-[110px_1fr_190px_150px_110px] gap-3 border-b border-outline-variant/30 bg-surface-container-low px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-on-surface-variant"><span>Loại</span><span>Nội dung</span><span>Thời gian</span><span>Phụ trách</span><span>Hoạt động</span></div>{sessions.map(session => { const hasTest = session.items?.some(item => item.itemType === "TEST"); return <button key={session.id} onClick={() => canManage && onOpen(session)} className={`grid w-full grid-cols-[110px_1fr_190px_150px_110px] items-center gap-3 border-b border-outline-variant/25 px-5 py-4 text-left transition last:border-0 ${canManage ? "hover:bg-surface-container-low/30" : "cursor-default"}`}><span className={`text-xs font-extrabold ${hasTest ? "text-amber-800" : "text-primary"}`}>{hasTest ? (session.title || "MINI TEST") : `SESSION ${pad(session.sessionNo)}`}</span><span><strong className="block text-sm">{session.content?.split("\n").filter(Boolean).slice(0, 2).join(" · ") || session.title || "Chưa có nội dung"}</strong><small className="mt-1 block truncate text-on-surface-variant">{session.phaseName || "Chưa xác định giai đoạn"}{session.zoomUrl ? " · Zoom" : ""}</small></span><span className="text-xs font-semibold text-on-surface-variant">{new Date(session.startsAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}</span><span className="truncate text-xs font-semibold">{session.teacherName || "Chưa phân công"}</span><span className="flex items-center gap-2 text-xs font-bold"><NotePencil size={16} className="text-primary" />{hasTest ? "Đánh giá" : `${session.items?.length ?? 0}/10`}</span></button>; })}</div></div>;
}
