import {
  CalendarBlank, CalendarCheck, CaretDown, ChartBar, ChatCircleDots, Check, CheckCircle, FloppyDisk, MagnifyingGlass,
  NotePencil, UserMinus, UsersThree, Warning, WarningCircle, X,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AttendanceSheet, AttendanceSessionSummary, AttendanceStatus, AttendanceStudentRow, Enrollment,
} from "../../academic-types";
import { apiFetch } from "../../lib/api";

interface CourseAttendanceProps {
  courseId: string;
  roster: { enrollment: Enrollment; student: { id: string } }[];
  onSelectStudent?: (studentId: string) => void;
  onEnrollmentUpdated?: (enrollment: Enrollment) => void;
}

type StudentAttendanceStat = {
  studentId: string; fullName: string; studentCode: string; marked: number;
  attended: number; absent: number; late: number; interactionCount: number; rate: number;
};

const statusMeta: Record<AttendanceStatus, { label: string; tone: string }> = {
  PENDING: { label: "Chưa đánh dấu", tone: "bg-surface-container text-on-surface-variant" },
  PRESENT: { label: "Có mặt", tone: "bg-emerald-50 text-emerald-700" },
  LATE: { label: "Đi muộn", tone: "bg-amber-50 text-amber-800" },
  LEFT_EARLY: { label: "Về sớm", tone: "bg-orange-50 text-orange-700" },
  ABSENT: { label: "Vắng", tone: "bg-rose-50 text-rose-700" },
  EXCUSED: { label: "Vắng có phép", tone: "bg-blue-50 text-blue-700" },
};

const statusOptions = Object.keys(statusMeta) as AttendanceStatus[];

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}

export default function CourseAttendance({ courseId, roster, onSelectStudent, onEnrollmentUpdated }: CourseAttendanceProps) {
  const [sessions, setSessions] = useState<AttendanceSessionSummary[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [sheet, setSheet] = useState<AttendanceSheet | null>(null);
  const [rows, setRows] = useState<AttendanceStudentRow[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | "ALL">("ALL");
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [statsOpen, setStatsOpen] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");
  const [statsSheets, setStatsSheets] = useState<AttendanceSheet[]>([]);
  const [noteTarget, setNoteTarget] = useState<{ row: AttendanceStudentRow; enrollment: Enrollment } | null>(null);

  const enrollmentByStudent = useMemo(() => new Map(roster.map(item => [item.student.id, item.enrollment])), [roster]);

  const loadSessions = useCallback(async (preferredId?: string) => {
    const values = await apiFetch<AttendanceSessionSummary[]>(`/admin/courses/${courseId}/attendance/sessions`);
    setSessions(values);
    setSelectedId(current => preferredId || current || [...values].reverse().find(item => new Date(item.startsAt) <= new Date())?.sessionId || values[0]?.sessionId || "");
  }, [courseId]);

  useEffect(() => {
    setLoading(true); setError("");
    void loadSessions().catch(value => setError(value instanceof Error ? value.message : "Không tải được dữ liệu điểm danh"))
      .finally(() => setLoading(false));
  }, [loadSessions]);

  const selectedSummary = sessions.find(item => item.sessionId === selectedId) ?? null;

  const loadAttendance = useCallback(async () => {
    if (!selectedId || !selectedSummary) { setSheet(null); setRows([]); return; }
    setLoading(true); setError("");
    try {
      const value = await apiFetch<AttendanceSheet>(`/admin/courses/${courseId}/attendance/sessions/${selectedId}${selectedSummary.sheetStatus ? "" : "/initialize"}`, selectedSummary.sheetStatus ? undefined : { method: "POST" });
      setSheet(value);
      setRows(value.students.map(row => ({ ...row, interactionCount: row.interactionCount ?? 0 })));
      setDirty(new Set());
      if (!selectedSummary.sheetStatus) {
        setSessions(current => current.map(item => item.sessionId === selectedId ? value.session : item));
      }
    } catch (value) { setError(value instanceof Error ? value.message : "Không tải được điểm danh của buổi học"); }
    finally { setLoading(false); }
  }, [courseId, loadSessions, selectedId, selectedSummary]);

  useEffect(() => { void loadAttendance(); }, [loadAttendance]);

  const updateRow = (studentId: string, patch: Partial<AttendanceStudentRow>) => {
    setRows(current => current.map(row => row.studentId === studentId ? { ...row, ...patch } : row));
    setDirty(current => new Set(current).add(studentId));
    setNotice("");
  };

  const visibleRows = useMemo(() => rows.filter(row => {
    const text = `${row.fullName} ${row.studentCode} ${row.email ?? ""}`.toLowerCase();
    return text.includes(query.trim().toLowerCase()) && (statusFilter === "ALL" || row.status === statusFilter);
  }), [rows, query, statusFilter]);

  async function saveAttendance() {
    if (!selectedId || !rows.length) return;
    setBusy(true); setError("");
    try {
      const value = await apiFetch<AttendanceSheet>(`/admin/courses/${courseId}/attendance/sessions/${selectedId}`, {
        method: "PUT",
        body: JSON.stringify({ entries: rows.map(row => ({
          studentId: row.studentId,
          status: row.status,
          joinedAt: row.joinedAt,
          leftAt: row.leftAt,
          durationSeconds: row.durationSeconds,
          interactionCount: row.interactionCount,
          note: row.note,
        })) }),
      });
      setSheet(value);
      setRows(value.students.map(row => ({ ...row, interactionCount: row.interactionCount ?? 0 })));
      setDirty(new Set());
      setNotice("Đã lưu điểm danh.");
      await loadSessions(selectedId);
    } catch (value) { setError(value instanceof Error ? value.message : "Không lưu được điểm danh"); }
    finally { setBusy(false); }
  }

  function markRemainingPresent() {
    const pending = rows.filter(row => row.status === "PENDING").map(row => row.studentId);
    if (!pending.length) return;
    const ids = new Set(pending);
    setRows(current => current.map(row => ids.has(row.studentId) ? { ...row, status: "PRESENT" } : row));
    setDirty(current => new Set([...current, ...pending]));
    setNotice("");
  }

  const markedCount = rows.filter(row => row.status !== "PENDING").length;
  const presentCount = rows.filter(row => ["PRESENT", "LATE", "LEFT_EARLY"].includes(row.status)).length;
  const absentCount = rows.filter(row => row.status === "ABSENT").length;
  const recordedSessions = sessions.filter(item => item.markedCount > 0);
  const averageAttendance = recordedSessions.length
    ? Math.round(recordedSessions.reduce((total, item) => total + item.attendanceRate, 0) / recordedSessions.length)
    : 0;
  const totalAbsences = recordedSessions.reduce((total, item) => total + item.absentCount + item.excusedCount, 0);

  async function openStats() {
    setStatsOpen(true); setStatsLoading(true); setStatsError("");
    try {
      setStatsSheets(await Promise.all(recordedSessions.map(item => apiFetch<AttendanceSheet>(`/admin/courses/${courseId}/attendance/sessions/${item.sessionId}`))));
    } catch (value) { setStatsError(value instanceof Error ? value.message : "Không tải được thống kê điểm danh"); }
    finally { setStatsLoading(false); }
  }

  return <div className="space-y-3">
    <section className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface">
      <header className="flex flex-col gap-3 border-b border-outline-variant/30 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-container/20 text-primary"><UsersThree size={21}/></span><div><h2 className="font-display text-lg font-bold">Điểm danh</h2><div className="mt-0.5 flex items-center gap-3 text-xs font-bold tabular-nums"><span className="inline-flex items-center gap-1 text-on-surface-variant" title={`${markedCount}/${rows.length} đã đánh dấu`} aria-label={`${markedCount}/${rows.length} đã đánh dấu`}><CheckCircle size={15}/>{markedCount}/{rows.length}</span><span className="inline-flex items-center gap-1 text-emerald-700" title={`${presentCount} tham dự`} aria-label={`${presentCount} tham dự`}><UsersThree size={15}/>{presentCount}</span><span className="inline-flex items-center gap-1 text-rose-700" title={`${absentCount} vắng`} aria-label={`${absentCount} vắng`}><UserMinus size={15}/>{absentCount}</span></div></div></div>
          <label className="relative min-w-0 sm:ml-4 sm:w-[520px]"><span className="sr-only">Chọn buổi học</span><select value={selectedId} title={selectedSummary?.title ?? undefined} onChange={event => { setSelectedId(event.target.value); setNotice(""); setError(""); }} className="min-h-11 w-full appearance-none rounded-xl border-outline-variant/60 bg-surface py-2 pl-3 pr-11 text-sm font-bold focus:border-primary focus:ring-primary"><option value="">Chọn buổi học</option>{sessions.map(item => <option key={item.sessionId} value={item.sessionId}>Buổi {item.sessionNo} · {item.title || `Session ${item.sessionNo}`} · {formatDateTime(item.startsAt)}</option>)}</select><CaretDown size={16} weight="bold" aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant"/></label>
        </div>
        <div className="flex gap-2"><button disabled={!rows.some(row => row.status === "PENDING") || busy} onClick={markRemainingPresent} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-800 disabled:opacity-40"><Check size={17}/> Còn lại có mặt</button><button disabled={!dirty.size || busy} onClick={() => void saveAttendance()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-on-primary disabled:opacity-40"><FloppyDisk size={17}/> {busy ? "Đang lưu..." : "Lưu điểm danh"}</button></div>
      </header>

      {error && <div role="alert" className="m-4 flex items-start gap-3 rounded-xl border border-error/20 bg-error-container/20 p-3 text-sm font-semibold text-error"><Warning className="mt-0.5 shrink-0" size={18}/><span>{error}</span></div>}
      {notice && <div className="m-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800"><CheckCircle className="mt-0.5 shrink-0" size={18}/><span>{notice}</span></div>}

      {!selectedSummary ? <EmptyState text={loading ? "Đang tải danh sách buổi học..." : "Khóa học chưa có buổi học để điểm danh."} /> : loading && !sheet ? <EmptyState text="Đang tải điểm danh..." /> : <>
        <div className="flex flex-col gap-2 border-b border-outline-variant/30 p-3 sm:flex-row"><label className="relative w-full sm:max-w-xl sm:flex-1"><span className="sr-only">Tìm học viên</span><MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline"/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm tên hoặc mã học viên" className="min-h-11 w-full rounded-xl border-outline-variant/60 bg-surface pl-10 text-sm focus:border-primary focus:ring-primary"/></label><select aria-label="Lọc trạng thái" value={statusFilter} onChange={event => setStatusFilter(event.target.value as AttendanceStatus | "ALL")} className="min-h-11 rounded-xl border-outline-variant/60 bg-surface text-sm focus:border-primary focus:ring-primary"><option value="ALL">Tất cả trạng thái</option>{statusOptions.map(status => <option key={status} value={status}>{statusMeta[status].label}</option>)}</select><button type="button" onClick={() => void openStats()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary/25 bg-primary-container/15 px-4 text-sm font-bold text-primary hover:bg-primary-container/25 active:scale-[0.98]"><ChartBar size={18}/> Thống kê điểm danh</button></div>

        <div className="overflow-x-auto"><table className="w-full min-w-[760px] border-collapse text-left text-sm"><thead><tr className="border-b border-outline-variant/30 bg-surface-container-low/40 text-xs font-bold text-on-surface-variant"><th className="px-5 py-3">Học viên</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3 text-center">Lượt tương tác</th><th className="px-5 py-3">Ghi chú buổi học</th></tr></thead><tbody className="divide-y divide-outline-variant/25">{visibleRows.map(row => <tr key={row.studentId} className={dirty.has(row.studentId) ? "bg-amber-50/30" : "hover:bg-surface-container-low/20"}><td className="px-5 py-3"><StudentIdentityCell row={row} enrollment={enrollmentByStudent.get(row.studentId)} onSelect={onSelectStudent} onEditNote={(enrollment) => setNoteTarget({ row, enrollment })}/></td><td className="px-4 py-3"><select value={row.status} onChange={event => updateRow(row.studentId, { status: event.target.value as AttendanceStatus })} className={`min-h-10 w-[150px] rounded-xl border-0 text-xs font-bold focus:ring-primary ${statusMeta[row.status].tone}`}>{statusOptions.map(status => <option key={status} value={status}>{statusMeta[status].label}</option>)}</select></td><td className="px-4 py-3"><label className="relative mx-auto block w-28"><ChatCircleDots size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline"/><span className="sr-only">Số lượt tương tác của {row.fullName}</span><input type="number" min={0} step={1} value={row.interactionCount} onChange={event => updateRow(row.studentId, { interactionCount: Math.max(0, Number.parseInt(event.target.value || "0", 10)) })} className="min-h-10 w-full rounded-xl border-outline-variant/50 bg-surface pl-9 text-center text-sm font-bold tabular-nums focus:border-primary focus:ring-primary"/></label></td><td className="px-5 py-3"><input value={row.note ?? ""} onChange={event => updateRow(row.studentId, { note: event.target.value || null })} placeholder="Chỉ áp dụng buổi này" className="min-h-10 w-full min-w-[220px] rounded-xl border-outline-variant/50 bg-surface text-xs focus:border-primary focus:ring-primary"/></td></tr>)}</tbody></table>{!visibleRows.length && <p className="p-10 text-center text-sm text-on-surface-variant">Không có học viên phù hợp bộ lọc.</p>}</div>
      </>}
    </section>
    {statsOpen && <AttendanceStatsModal sessions={sessions} recordedSessions={recordedSessions} sheets={statsSheets} loading={statsLoading} error={statsError} averageAttendance={averageAttendance} totalAbsences={totalAbsences} onClose={() => setStatsOpen(false)} onSelectStudent={onSelectStudent}/>}
    {noteTarget && <StudentNoteModal
      courseId={courseId}
      target={noteTarget}
      onClose={() => setNoteTarget(null)}
      onSaved={enrollment => { onEnrollmentUpdated?.(enrollment); setNoteTarget(null); setNotice("Đã lưu ghi chú dùng chung của học viên."); }}
    />}
  </div>;
}

function StudentIdentityCell({ row, enrollment, onSelect, onEditNote }: {
  row: AttendanceStudentRow; enrollment?: Enrollment;
  onSelect?: (studentId: string) => void; onEditNote: (enrollment: Enrollment) => void;
}) {
  const hasNote = Boolean(enrollment?.attendanceNote?.trim());
  return <div className="flex items-center gap-3"><button type="button" onClick={() => onSelect?.(row.studentId)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-container/25 text-xs font-black text-primary">{row.fullName.trim().charAt(0).toUpperCase()}</button><span className="min-w-0"><span className="flex items-center gap-0.5"><button type="button" onClick={() => onSelect?.(row.studentId)} className="max-w-[220px] truncate font-bold hover:text-primary hover:underline">{row.fullName}</button><button type="button" disabled={!enrollment} onClick={() => enrollment && onEditNote(enrollment)} aria-label={`${hasNote ? "Xem hoặc sửa" : "Thêm"} ghi chú dùng chung cho ${row.fullName}`} title={hasNote ? enrollment?.attendanceNote ?? undefined : "Thêm ghi chú dùng chung"} className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-colors disabled:opacity-30 ${hasNote ? "bg-primary-container/30 text-primary" : "text-outline hover:bg-surface-container hover:text-primary"}`}><NotePencil size={17} weight={hasNote ? "fill" : "regular"}/></button></span><small className="block text-on-surface-variant">{row.studentCode}</small></span></div>;
}

function StudentNoteModal({ courseId, target, onClose, onSaved }: {
  courseId: string; target: { row: AttendanceStudentRow; enrollment: Enrollment };
  onClose: () => void; onSaved: (enrollment: Enrollment) => void;
}) {
  const [note, setNote] = useState(target.enrollment.attendanceNote ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape" && !saving) onClose(); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose, saving]);

  async function saveNote() {
    setSaving(true); setError("");
    try {
      const enrollment = await apiFetch<Enrollment>(`/admin/enrollments/courses/${courseId}/students/${target.row.studentId}/note`, {
        method: "PATCH",
        body: JSON.stringify({ note: note.trim() || null }),
      });
      onSaved(enrollment);
    } catch (value) { setError(value instanceof Error ? value.message : "Không lưu được ghi chú học viên"); }
    finally { setSaving(false); }
  }

  return <div className="fixed inset-0 z-[80] grid place-items-center bg-on-background/45 p-4 backdrop-blur-sm" onMouseDown={event => { if (event.target === event.currentTarget && !saving) onClose(); }}><section role="dialog" aria-modal="true" aria-labelledby="student-note-title" className="w-full max-w-lg overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface shadow-2xl"><header className="flex items-start justify-between gap-4 border-b border-outline-variant/30 px-5 py-4"><div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-container/25 text-primary"><NotePencil size={21}/></span><div className="min-w-0"><h2 id="student-note-title" className="truncate font-display text-lg font-bold">Ghi chú học viên</h2><p className="truncate text-sm text-on-surface-variant">{target.row.fullName} · {target.row.studentCode}</p></div></div><button type="button" disabled={saving} onClick={onClose} aria-label="Đóng" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-outline-variant/50 text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40"><X size={19}/></button></header><div className="space-y-4 p-5"><p className="text-sm leading-6 text-on-surface-variant">Ghi chú này áp dụng cho toàn bộ buổi học trong khóa, ví dụ lịch học trực tiếp riêng hoặc buổi học viên xem bản ghi.</p><label className="block text-sm font-bold text-on-surface">Nội dung ghi chú<textarea autoFocus rows={5} maxLength={2000} value={note} onChange={event => setNote(event.target.value)} placeholder="Ví dụ: Học trực tiếp thứ Hai, buổi thứ Tư xem bản ghi." className="mt-2 w-full resize-y rounded-xl border-outline-variant/60 bg-surface text-sm font-normal leading-6 focus:border-primary focus:ring-primary"/></label><div className="flex items-center justify-between text-xs text-on-surface-variant"><span>Dùng chung cho tất cả buổi</span><span className="tabular-nums">{note.length}/2000</span></div>{error && <div role="alert" className="rounded-xl border border-error/20 bg-error-container/20 p-3 text-sm font-semibold text-error">{error}</div>}<div className="flex justify-end gap-2 pt-1"><button type="button" disabled={saving} onClick={onClose} className="min-h-11 rounded-xl border border-outline-variant/60 px-4 text-sm font-bold disabled:opacity-40">Hủy</button><button type="button" disabled={saving} onClick={() => void saveNote()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-on-primary disabled:opacity-50"><FloppyDisk size={17}/>{saving ? "Đang lưu..." : "Lưu ghi chú"}</button></div></div></section></div>;
}

function AttendanceStatsModal({ sessions, recordedSessions, sheets, loading, error, averageAttendance, totalAbsences, onClose, onSelectStudent }: {
  sessions: AttendanceSessionSummary[]; recordedSessions: AttendanceSessionSummary[]; sheets: AttendanceSheet[];
  loading: boolean; error: string; averageAttendance: number; totalAbsences: number;
  onClose: () => void; onSelectStudent?: (studentId: string) => void;
}) {
  const [view, setView] = useState<"overview" | "students">("overview");
  const studentStats = useMemo(() => {
    const values = new Map<string, Omit<StudentAttendanceStat, "rate">>();
    sheets.flatMap(item => item.students).forEach(row => {
      if (row.status === "PENDING") return;
      const current = values.get(row.studentId) ?? { studentId: row.studentId, fullName: row.fullName, studentCode: row.studentCode, marked: 0, attended: 0, absent: 0, late: 0, interactionCount: 0 };
      current.marked += 1;
      if (["PRESENT", "LATE", "LEFT_EARLY"].includes(row.status)) current.attended += 1;
      if (["ABSENT", "EXCUSED"].includes(row.status)) current.absent += 1;
      if (row.status === "LATE") current.late += 1;
      current.interactionCount += row.interactionCount ?? 0;
      values.set(row.studentId, current);
    });
    return [...values.values()].map(item => ({ ...item, rate: item.marked ? Math.round(item.attended * 100 / item.marked) : 0 })).sort((a, b) => a.rate - b.rate || a.fullName.localeCompare(b.fullName, "vi"));
  }, [sheets]);
  const attentionStudents = studentStats.filter(item => item.rate < 80);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", closeOnEscape); };
  }, [onClose]);

  return <div className="fixed inset-0 z-[70] grid place-items-center bg-on-background/45 p-3 backdrop-blur-sm sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="attendance-stats-title" className="flex max-h-[90dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface shadow-2xl">
      <header className="flex items-start justify-between gap-4 border-b border-outline-variant/30 px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-container/25 text-primary"><ChartBar size={23}/></span><div><h2 id="attendance-stats-title" className="font-display text-xl font-bold text-on-surface">Thống kê điểm danh</h2><p className="mt-0.5 text-sm text-on-surface-variant">Tổng quan chuyên cần và học viên cần hỗ trợ</p></div></div>
        <button type="button" onClick={onClose} aria-label="Đóng thống kê" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-outline-variant/50 text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"><X size={20}/></button>
      </header>

      <div className="flex items-center border-b border-outline-variant/30 px-5 sm:px-6" role="tablist" aria-label="Loại thống kê">
        <StatsTab active={view === "overview"} onClick={() => setView("overview")}><ChartBar size={17}/> Tổng quan</StatsTab>
        <StatsTab active={view === "students"} onClick={() => setView("students")}><UsersThree size={17}/> Chi tiết học viên</StatsTab>
      </div>

      <div className="overflow-y-auto p-5 sm:p-6">
        {loading ? <StatsLoading/> : error ? <div role="alert" className="rounded-xl border border-error/20 bg-error-container/20 p-4 text-sm font-semibold text-error">{error}</div> : view === "overview" ? <div className="space-y-6">
          <section className="grid overflow-hidden rounded-2xl border border-outline-variant/35 bg-surface-container-low/35 lg:grid-cols-[1.15fr_1fr]">
            <div className="flex flex-col items-center gap-5 p-5 sm:flex-row sm:p-6">
              <AttendanceRateRing rate={averageAttendance}/>
              <div className="text-center sm:text-left"><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Mức chuyên cần lớp</p><h3 className="mt-2 font-display text-2xl font-bold text-on-surface">{averageAttendance >= 90 ? "Duy trì rất tốt" : averageAttendance >= 80 ? "Đang ở mức ổn định" : "Cần cải thiện"}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-on-surface-variant">Tỷ lệ được tính từ {recordedSessions.length} buổi đã điểm danh. Mục tiêu khuyến nghị là từ 80% trở lên.</p></div>
            </div>
            <dl className="grid grid-cols-3 border-t border-outline-variant/30 bg-surface lg:border-l lg:border-t-0">
              <SummaryMetric icon={<CalendarCheck size={20}/>} label="Đã điểm danh" value={`${recordedSessions.length}/${sessions.length}`}/>
              <SummaryMetric icon={<UserMinus size={20}/>} label="Lượt vắng" value={String(totalAbsences)} tone="text-rose-700"/>
              <SummaryMetric icon={<WarningCircle size={20}/>} label="Cần chú ý" value={String(attentionStudents.length)} tone="text-amber-700"/>
            </dl>
          </section>

          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <section aria-labelledby="attention-heading"><div className="mb-3 flex items-center justify-between gap-3"><h3 id="attention-heading" className="font-display text-lg font-bold">Học viên cần chú ý</h3><span className="rounded-full bg-error-container/25 px-2.5 py-1 text-xs font-bold text-error">Dưới 80%</span></div>{attentionStudents.length ? <div className="overflow-hidden rounded-xl border border-outline-variant/35 bg-surface">{attentionStudents.slice(0, 6).map(item => <button type="button" key={item.studentId} onClick={() => { onClose(); onSelectStudent?.(item.studentId); }} className="flex w-full items-center gap-3 border-b border-outline-variant/25 px-4 py-3 text-left last:border-0 hover:bg-surface-container-low"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-error-container/30 text-sm font-black text-error">{item.fullName.trim().charAt(0).toUpperCase()}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{item.fullName}</strong><small className="text-on-surface-variant">{item.absent} vắng · {item.late} đi muộn</small></span><span className="min-w-12 text-right"><strong className="block tabular-nums text-error">{item.rate}%</strong><span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-error-container/35"><span className="block h-full rounded-full bg-error" style={{ width: `${item.rate}%` }}/></span></span></button>)}</div> : <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800"><CheckCircle size={22}/> Tất cả học viên đều đạt ngưỡng chuyên cần.</div>}</section>

            <section aria-labelledby="session-heading"><div className="mb-3 flex items-center justify-between gap-3"><h3 id="session-heading" className="font-display text-lg font-bold">Tỷ lệ theo buổi</h3><span className="text-xs font-semibold text-on-surface-variant">{recordedSessions.length} buổi có dữ liệu</span></div><div className="max-h-[286px] space-y-1 overflow-y-auto rounded-xl border border-outline-variant/35 bg-surface p-2">{recordedSessions.map(item => <SessionRateRow key={item.sessionId} item={item}/>)}{!recordedSessions.length && <p className="p-8 text-center text-sm text-on-surface-variant">Chưa có buổi học đã điểm danh.</p>}</div></section>
          </div>
        </div> : <StudentAttendanceTable
          values={studentStats}
          onSelectStudent={studentId => { onClose(); onSelectStudent?.(studentId); }}
        />}
      </div>
    </section>
  </div>;
}

function StatsTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`inline-flex min-h-12 items-center gap-2 border-b-2 px-4 text-sm font-bold transition-colors ${active ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"}`}>{children}</button>;
}

function AttendanceRateRing({ rate }: { rate: number }) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, rate));
  return <div className="relative h-36 w-36 shrink-0" role="img" aria-label={`Tỷ lệ tham dự trung bình ${rate}%`}><svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-surface-container-high"/><circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress / 100)} className={rate >= 80 ? "text-primary" : "text-error"}/></svg><div className="absolute inset-0 grid place-items-center text-center"><span><strong className="block font-display text-3xl font-black tabular-nums">{rate}%</strong><small className="font-semibold text-on-surface-variant">tham dự</small></span></div></div>;
}

function SummaryMetric({ icon, label, value, tone = "text-primary" }: { icon: React.ReactNode; label: string; value: string; tone?: string }) {
  return <div className="flex min-w-0 flex-col items-center justify-center border-r border-outline-variant/25 px-2 py-5 text-center last:border-0 lg:border-b lg:border-r-0 last:lg:border-b-0"><span className={tone}>{icon}</span><dd className="mt-2 font-display text-2xl font-black tabular-nums text-on-surface">{value}</dd><dt className="mt-1 text-[11px] font-semibold leading-4 text-on-surface-variant">{label}</dt></div>;
}

function SessionRateRow({ item }: { item: AttendanceSessionSummary }) {
  const rate = Math.round(item.attendanceRate);
  const attended = item.presentCount + item.lateCount + item.leftEarlyCount;
  return <div className="rounded-lg px-3 py-2.5 hover:bg-surface-container-low"><div className="flex items-center gap-3 text-sm"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-container/20 text-xs font-black text-primary">{item.sessionNo}</span><span className="min-w-0 flex-1 truncate font-semibold">{item.title || `Session ${item.sessionNo}`}</span><span className="text-xs tabular-nums text-on-surface-variant">{attended}/{item.totalStudents}</span><strong className={`w-12 text-right tabular-nums ${rate < 80 ? "text-error" : "text-primary"}`}>{rate}%</strong></div><div className="ml-11 mt-2 h-1.5 overflow-hidden rounded-full bg-surface-container-high"><div className={`h-full rounded-full ${rate < 80 ? "bg-error" : "bg-primary"}`} style={{ width: `${Math.max(0, Math.min(100, rate))}%` }}/></div></div>;
}

function StudentAttendanceTable({ values, onSelectStudent }: { values: StudentAttendanceStat[]; onSelectStudent?: (studentId: string) => void }) {
  return <div className="overflow-hidden rounded-xl border border-outline-variant/35"><div className="overflow-x-auto"><table className="w-full min-w-[720px] border-collapse text-left text-sm"><thead><tr className="border-b border-outline-variant/35 bg-surface-container-low/60 text-xs font-bold text-on-surface-variant"><th className="px-4 py-3">Học viên</th><th className="px-3 py-3 text-center">Tham dự</th><th className="px-3 py-3 text-center">Vắng</th><th className="px-3 py-3 text-center">Đi muộn</th><th className="px-3 py-3 text-center">Tương tác</th><th className="px-4 py-3">Mức tham gia</th></tr></thead><tbody className="divide-y divide-outline-variant/25">{values.map(item => <tr key={item.studentId} className={item.rate < 80 ? "bg-error-container/10" : "hover:bg-surface-container-low/35"}><td className="px-4 py-3"><button type="button" onClick={() => onSelectStudent?.(item.studentId)} className="flex items-center gap-3 text-left"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-black ${item.rate < 80 ? "bg-error-container/30 text-error" : "bg-primary-container/25 text-primary"}`}>{item.fullName.trim().charAt(0).toUpperCase()}</span><span><strong className="block hover:text-primary hover:underline">{item.fullName}</strong><small className="text-on-surface-variant">{item.studentCode}</small></span></button></td><td className="px-3 py-3 text-center font-semibold tabular-nums">{item.attended}/{item.marked}</td><td className="px-3 py-3 text-center tabular-nums">{item.absent}</td><td className="px-3 py-3 text-center tabular-nums">{item.late}</td><td className="px-3 py-3 text-center tabular-nums">{item.interactionCount}</td><td className="w-40 px-4 py-3"><div className="flex items-center gap-3"><span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-container-high"><span className={`block h-full rounded-full ${item.rate < 80 ? "bg-error" : "bg-primary"}`} style={{ width: `${item.rate}%` }}/></span><strong className={`w-10 text-right tabular-nums ${item.rate < 80 ? "text-error" : "text-emerald-700"}`}>{item.rate}%</strong></div></td></tr>)}</tbody></table></div>{!values.length && <p className="py-10 text-center text-sm text-on-surface-variant">Chưa có dữ liệu điểm danh học viên.</p>}</div>;
}

function StatsLoading() {
  return <div className="space-y-3" aria-label="Đang tải thống kê"><div className="h-28 animate-pulse rounded-2xl bg-surface-container"/><div className="h-16 animate-pulse rounded-xl bg-surface-container"/><div className="h-16 animate-pulse rounded-xl bg-surface-container"/></div>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="grid min-h-64 place-items-center p-8 text-center"><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-surface-container text-on-surface-variant"><CalendarBlank size={24}/></span><p className="mt-4 text-sm font-semibold text-on-surface-variant">{text}</p></div></div>;
}
