import {
  ArrowClockwise, CalendarBlank, CaretRight, Check, CheckCircle, Clock, FloppyDisk,
  Info, Lock, LockOpen, MagnifyingGlass, Timer, UsersThree, Warning, X,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AttendanceSheet, AttendanceSessionSummary, AttendanceStatus, AttendanceStudentRow,
} from "../../academic-types";
import { apiFetch } from "../../lib/api";

interface CourseAttendanceProps {
  courseId: string;
  roster: { enrollment: { id: string }; student: { id: string } }[];
  onSelectStudent?: (studentId: string) => void;
}

const statusMeta: Record<AttendanceStatus, { label: string; short: string; tone: string }> = {
  PENDING: { label: "Chưa đánh dấu", short: "—", tone: "bg-surface-container text-on-surface-variant" },
  PRESENT: { label: "Có mặt", short: "CM", tone: "bg-emerald-50 text-emerald-700" },
  LATE: { label: "Đi muộn", short: "M", tone: "bg-amber-50 text-amber-800" },
  LEFT_EARLY: { label: "Về sớm", short: "VS", tone: "bg-orange-50 text-orange-700" },
  ABSENT: { label: "Vắng", short: "V", tone: "bg-rose-50 text-rose-700" },
  EXCUSED: { label: "Vắng có phép", short: "P", tone: "bg-blue-50 text-blue-700" },
};

const statusOptions = Object.keys(statusMeta) as AttendanceStatus[];

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}

function timeValue(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
}

function combineTime(dateSource: string, time: string) {
  if (!time) return null;
  const date = new Date(dateSource);
  const [hour, minute] = time.split(":").map(Number);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export default function CourseAttendance({ courseId, roster, onSelectStudent }: CourseAttendanceProps) {
  const [sessions, setSessions] = useState<AttendanceSessionSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [sheet, setSheet] = useState<AttendanceSheet | null>(null);
  const [rows, setRows] = useState<AttendanceStudentRow[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | "ALL">("ALL");
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState("");

  const loadSessions = useCallback(async (preferredId?: string) => {
    const values = await apiFetch<AttendanceSessionSummary[]>(`/admin/courses/${courseId}/attendance/sessions`);
    setSessions(values);
    setSelectedId(current => preferredId || current || values.find(item => item.sheetStatus !== "LOCKED")?.sessionId || values[0]?.sessionId || "");
  }, [courseId]);

  useEffect(() => {
    setLoading(true); setError("");
    void loadSessions().catch(value => setError(value instanceof Error ? value.message : "Không tải được dữ liệu điểm danh"))
      .finally(() => setLoading(false));
  }, [loadSessions]);

  const selectedSummary = sessions.find(item => item.sessionId === selectedId) ?? null;

  const loadSheet = useCallback(async () => {
    if (!selectedId || !selectedSummary?.sheetStatus) { setSheet(null); setRows([]); setDirty(new Set()); return; }
    setLoading(true); setError("");
    try {
      const value = await apiFetch<AttendanceSheet>(`/admin/courses/${courseId}/attendance/sessions/${selectedId}`);
      setSheet(value); setRows(value.students); setDirty(new Set());
    } catch (value) { setError(value instanceof Error ? value.message : "Không tải được phiếu điểm danh"); }
    finally { setLoading(false); }
  }, [courseId, selectedId, selectedSummary?.sheetStatus]);

  useEffect(() => { void loadSheet(); }, [loadSheet]);

  const updateRow = (studentId: string, patch: Partial<AttendanceStudentRow>) => {
    setRows(current => current.map(row => row.studentId === studentId ? { ...row, ...patch } : row));
    setDirty(current => new Set(current).add(studentId));
    setNotice("");
  };

  const visibleRows = useMemo(() => rows.filter(row => {
    const text = `${row.fullName} ${row.studentCode} ${row.email ?? ""}`.toLowerCase();
    return text.includes(query.trim().toLowerCase()) && (statusFilter === "ALL" || row.status === statusFilter);
  }), [rows, query, statusFilter]);

  const courseRate = useMemo(() => {
    const finalized = sessions.filter(item => item.sheetStatus === "LOCKED");
    if (!finalized.length) return 0;
    return Math.round(finalized.reduce((sum, item) => sum + Number(item.attendanceRate), 0) / finalized.length);
  }, [sessions]);

  async function initialize() {
    if (!selectedId) return;
    setBusy(true); setError("");
    try {
      const value = await apiFetch<AttendanceSheet>(`/admin/courses/${courseId}/attendance/sessions/${selectedId}/initialize`, { method: "POST" });
      setSheet(value); setRows(value.students); setNotice("Đã tạo phiếu từ danh sách học viên của khóa. Học viên chưa có kết quả được để ở trạng thái Chưa đánh dấu.");
      await loadSessions(selectedId);
    } catch (value) { setError(value instanceof Error ? value.message : "Không khởi tạo được phiếu điểm danh"); }
    finally { setBusy(false); }
  }

  async function saveDraft(silent = false) {
    if (!selectedId || !sheet || !rows.length) return null;
    setBusy(true); setError("");
    try {
      const value = await apiFetch<AttendanceSheet>(`/admin/courses/${courseId}/attendance/sessions/${selectedId}/draft`, {
        method: "PUT",
        body: JSON.stringify({ entries: rows.map(row => ({
          studentId: row.studentId, status: row.status, joinedAt: row.joinedAt,
          leftAt: row.leftAt, durationSeconds: row.durationSeconds, note: row.note,
        })) }),
      });
      setSheet(value); setRows(value.students); setDirty(new Set());
      if (!silent) setNotice("Đã lưu bản nháp điểm danh.");
      await loadSessions(selectedId);
      return value;
    } catch (value) { setError(value instanceof Error ? value.message : "Không lưu được bản nháp"); return null; }
    finally { setBusy(false); }
  }

  async function lockSheet() {
    if (!selectedId) return;
    if (dirty.size && !await saveDraft(true)) return;
    setBusy(true); setError("");
    try {
      const value = await apiFetch<AttendanceSheet>(`/admin/courses/${courseId}/attendance/sessions/${selectedId}/lock`, { method: "POST" });
      setSheet(value); setRows(value.students); setNotice("Phiếu đã được xác nhận và khóa.");
      await loadSessions(selectedId);
    } catch (value) { setError(value instanceof Error ? value.message : "Không khóa được phiếu điểm danh"); }
    finally { setBusy(false); }
  }

  async function reopen() {
    if (!selectedId || !reopenReason.trim()) return;
    setBusy(true); setError("");
    try {
      const value = await apiFetch<AttendanceSheet>(`/admin/courses/${courseId}/attendance/sessions/${selectedId}/reopen`, {
        method: "POST", body: JSON.stringify({ reason: reopenReason.trim() }),
      });
      setSheet(value); setRows(value.students); setReopenOpen(false); setReopenReason("");
      setNotice("Phiếu đã mở lại. Mọi chỉnh sửa tiếp theo sẽ được lưu ở bản nháp.");
      await loadSessions(selectedId);
    } catch (value) { setError(value instanceof Error ? value.message : "Không mở lại được phiếu điểm danh"); }
    finally { setBusy(false); }
  }

  const locked = sheet?.session.sheetStatus === "LOCKED";

  return <div className="space-y-5">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Vận hành lớp học</p><h2 className="mt-1 font-display text-2xl font-bold text-on-surface">Điểm danh theo từng buổi</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-on-surface-variant">Mỗi session có một phiếu độc lập. Giáo viên lưu nháp trong lúc dạy và xác nhận sau khi kiểm tra xong.</p></div>
      <button disabled title="Tích hợp Zoom Participant Report sẽ được phát triển ở giai đoạn tiếp theo" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-outline-variant/50 px-4 text-sm font-bold text-on-surface-variant opacity-60"><ArrowClockwise size={18}/> Zoom chưa tích hợp</button>
    </header>

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={CalendarBlank} label="Tổng số buổi" value={`${sessions.length}`} note={`${sessions.filter(item => item.sheetStatus === "LOCKED").length} phiếu đã khóa`} />
      <Metric icon={CheckCircle} label="Chuyên cần đã chốt" value={`${courseRate}%`} note="Không tính vắng có phép" />
      <Metric icon={UsersThree} label="Sĩ số hiện tại" value={`${roster.length}`} note="Theo danh sách ghi danh" />
      <Metric icon={Warning} label="Cần hoàn tất" value={`${sessions.filter(item => item.sheetStatus !== "LOCKED").length}`} note="Buổi chưa khóa phiếu" warning />
    </div>

    {error && <div role="alert" className="flex items-start gap-3 rounded-xl border border-error/20 bg-error-container/20 p-4 text-sm font-semibold text-error"><Warning className="mt-0.5 shrink-0" size={18}/><span>{error}</span></div>}
    {notice && <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800"><CheckCircle className="mt-0.5 shrink-0" size={18}/><span>{notice}</span></div>}

    <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface">
        <div className="border-b border-outline-variant/30 p-4"><h3 className="font-display text-base font-bold">Danh sách session</h3><p className="mt-1 text-xs text-on-surface-variant">Chọn một buổi để thao tác</p></div>
        <div className="max-h-[720px] divide-y divide-outline-variant/25 overflow-y-auto">
          {sessions.map(item => <button key={item.sessionId} onClick={() => { setSelectedId(item.sessionId); setNotice(""); setError(""); }} className={`flex min-h-[88px] w-full items-center gap-3 px-4 py-3 text-left transition-colors ${selectedId === item.sessionId ? "bg-primary-container/20" : "hover:bg-surface-container-low"}`}>
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-black ${item.sheetStatus === "LOCKED" ? "bg-emerald-50 text-emerald-700" : "bg-surface-container text-primary"}`}>{item.sessionNo}</span>
            <span className="min-w-0 flex-1"><strong className="block truncate text-sm text-on-surface">{item.title || `Session ${item.sessionNo}`}</strong><span className="mt-1 block text-xs text-on-surface-variant">{formatDateTime(item.startsAt)}</span><span className={`mt-1 inline-flex text-[10px] font-bold uppercase tracking-wide ${item.pendingCount > 0 ? "text-amber-700" : item.sheetStatus === "LOCKED" ? "text-emerald-700" : item.sheetStatus ? "text-primary" : "text-outline"}`}>{item.sheetStatus ? `${item.markedCount}/${item.totalStudents} đã đánh dấu${item.pendingCount ? ` · ${item.pendingCount} chưa đánh dấu` : item.sheetStatus === "LOCKED" ? " · đã khóa" : ""}` : "Chưa khởi tạo"}</span></span>
            <CaretRight size={16} className="shrink-0 text-outline"/>
          </button>)}
          {!sessions.length && !loading && <p className="p-6 text-center text-sm text-on-surface-variant">Khóa học chưa có session.</p>}
        </div>
      </aside>

      <section className="min-w-0 overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface">
        {!selectedSummary ? <EmptyState text="Chọn một session để bắt đầu điểm danh." /> : !selectedSummary.sheetStatus && !loading ? <div className="grid min-h-[420px] place-items-center p-8 text-center"><div className="max-w-md"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary-container/20 text-primary"><UsersThree size={27}/></span><h3 className="mt-4 font-display text-xl font-bold">Chưa có phiếu điểm danh</h3><p className="mt-2 text-sm leading-6 text-on-surface-variant">Hệ thống sẽ lấy toàn bộ danh sách học viên đã ghi danh của khóa. Người ghi danh sau buổi học vẫn hiển thị với trạng thái Chưa đánh dấu.</p><button disabled={busy} onClick={() => void initialize()} className="mt-5 min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary disabled:opacity-60">{busy ? "Đang khởi tạo..." : "Khởi tạo phiếu điểm danh"}</button></div></div> : loading && !sheet ? <EmptyState text="Đang tải phiếu điểm danh..." /> : sheet && <>
          <div className="border-b border-outline-variant/30 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-lg bg-primary-container/20 px-2.5 py-1 text-xs font-black text-primary">SESSION {sheet.session.sessionNo}</span><span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${locked ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{locked ? <Lock size={13}/> : <Clock size={13}/>} {locked ? "Đã khóa" : "Bản nháp"}</span>{dirty.size > 0 && <span className="text-xs font-bold text-amber-700">{dirty.size} thay đổi chưa lưu</span>}</div><h3 className="mt-2 font-display text-xl font-bold">{sheet.session.title || `Session ${sheet.session.sessionNo}`}</h3><p className="mt-1 text-sm text-on-surface-variant">{formatDateTime(sheet.session.startsAt)} · {sheet.session.teacherName || "Chưa phân công giáo viên"}</p></div>
              <div className="flex flex-wrap gap-2">{locked ? <button onClick={() => setReopenOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary/30 px-4 text-sm font-bold text-primary"><LockOpen size={17}/> Mở lại phiếu</button> : <><button disabled={busy || !dirty.size} onClick={() => void saveDraft()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-outline-variant/60 px-4 text-sm font-bold disabled:opacity-40"><FloppyDisk size={17}/> Lưu nháp</button><button disabled={busy || sheet.session.pendingCount > 0} onClick={() => void lockSheet()} title={sheet.session.pendingCount ? "Cần đánh dấu đủ học viên trước khi khóa" : "Xác nhận và khóa phiếu"} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-on-primary disabled:opacity-40"><Lock size={17}/> Xác nhận & khóa</button></>}</div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-4"><MiniStat label="Đã đánh dấu" value={`${sheet.session.markedCount}/${sheet.session.totalStudents}`} /><MiniStat label="Có mặt" value={`${sheet.session.presentCount}`} positive/><MiniStat label="Muộn / về sớm" value={`${sheet.session.lateCount + sheet.session.leftEarlyCount}`} warning/><MiniStat label="Vắng" value={`${sheet.session.absentCount}`} danger/></div>
          </div>

          <div className="flex flex-col gap-3 border-b border-outline-variant/30 bg-surface-container-low/30 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-2 sm:flex-row"><label className="relative flex-1"><span className="sr-only">Tìm học viên</span><MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline"/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm tên hoặc mã học viên" className="min-h-11 w-full rounded-xl border-outline-variant/60 bg-surface pl-10 text-sm focus:border-primary focus:ring-primary"/></label><select aria-label="Lọc trạng thái" value={statusFilter} onChange={event => setStatusFilter(event.target.value as AttendanceStatus | "ALL")} className="min-h-11 rounded-xl border-outline-variant/60 bg-surface text-sm focus:border-primary focus:ring-primary"><option value="ALL">Tất cả trạng thái</option>{statusOptions.map(status => <option key={status} value={status}>{statusMeta[status].label}</option>)}</select></div>
            {!locked && <button onClick={() => { rows.filter(row => row.status === "PENDING").forEach(row => updateRow(row.studentId, { status: "PRESENT" })); }} className="min-h-11 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-800"><Check size={17} className="mr-1 inline"/> Đánh dấu tất cả còn lại có mặt</button>}
          </div>

          <div className="overflow-x-auto"><table className="w-full min-w-[980px] border-collapse text-left text-sm"><thead><tr className="border-b border-outline-variant/30 bg-surface-container-low/40 text-xs uppercase tracking-wider text-on-surface-variant"><th className="px-5 py-4">Học viên</th><th className="px-4 py-4">Trạng thái</th><th className="px-4 py-4">Giờ vào</th><th className="px-4 py-4">Giờ ra</th><th className="px-4 py-4">Thời lượng</th><th className="px-4 py-4">Nguồn</th><th className="px-5 py-4">Ghi chú</th></tr></thead><tbody className="divide-y divide-outline-variant/25">{visibleRows.map(row => <tr key={row.studentId} className={dirty.has(row.studentId) ? "bg-amber-50/30" : "hover:bg-surface-container-low/20"}><td className="px-5 py-3"><button onClick={() => onSelectStudent?.(row.studentId)} className="flex items-center gap-3 text-left"><span className="grid h-9 w-9 place-items-center rounded-full bg-primary-container/25 text-xs font-black text-primary">{row.fullName.trim().charAt(0).toUpperCase()}</span><span><strong className="block max-w-[210px] truncate hover:text-primary hover:underline">{row.fullName}</strong><small className="text-on-surface-variant">{row.studentCode}</small></span></button></td><td className="px-4 py-3"><select disabled={locked} value={row.status} onChange={event => updateRow(row.studentId, { status: event.target.value as AttendanceStatus })} className={`min-h-10 w-[150px] rounded-xl border-0 text-xs font-bold focus:ring-primary disabled:opacity-80 ${statusMeta[row.status].tone}`}>{statusOptions.map(status => <option key={status} value={status}>{statusMeta[status].label}</option>)}</select></td><td className="px-4 py-3"><input disabled={locked} aria-label={`Giờ vào của ${row.fullName}`} type="time" value={timeValue(row.joinedAt)} onChange={event => updateRow(row.studentId, { joinedAt: combineTime(sheet.session.startsAt, event.target.value) })} className="min-h-10 w-[112px] rounded-xl border-outline-variant/50 bg-surface text-xs disabled:opacity-70"/></td><td className="px-4 py-3"><input disabled={locked} aria-label={`Giờ ra của ${row.fullName}`} type="time" value={timeValue(row.leftAt)} onChange={event => updateRow(row.studentId, { leftAt: combineTime(sheet.session.startsAt, event.target.value) })} className="min-h-10 w-[112px] rounded-xl border-outline-variant/50 bg-surface text-xs disabled:opacity-70"/></td><td className="px-4 py-3 text-xs font-semibold tabular-nums text-on-surface-variant">{row.durationSeconds == null ? "—" : `${Math.round(row.durationSeconds / 60)} phút`}</td><td className="px-4 py-3"><span className="rounded-lg bg-surface-container px-2 py-1 text-[10px] font-bold text-on-surface-variant">{row.source === "ZOOM" ? "ZOOM" : "THỦ CÔNG"}</span></td><td className="px-5 py-3"><input disabled={locked} value={row.note ?? ""} onChange={event => updateRow(row.studentId, { note: event.target.value || null })} placeholder="Lý do hoặc ghi chú" className="min-h-10 w-full min-w-[190px] rounded-xl border-outline-variant/50 bg-surface text-xs disabled:opacity-70"/></td></tr>)}</tbody></table>{!visibleRows.length && <p className="p-10 text-center text-sm text-on-surface-variant">Không có học viên phù hợp bộ lọc.</p>}</div>
          <div className="flex items-start gap-2 border-t border-outline-variant/30 bg-surface-container-low/30 p-4 text-xs leading-5 text-on-surface-variant"><Info size={16} className="mt-0.5 shrink-0 text-primary"/><span>“Vắng có phép” không tính vào mẫu số chuyên cần. Sau khi khóa, giáo viên không thể sửa; Admin hoặc Quản lý phải mở lại và ghi lý do.</span></div>
        </>}
      </section>
    </div>

    {reopenOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-background/45 p-4" role="dialog" aria-modal="true" aria-labelledby="reopen-title"><div className="w-full max-w-lg rounded-2xl bg-surface p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-primary">Kiểm soát thay đổi</p><h3 id="reopen-title" className="mt-1 font-display text-xl font-bold">Mở lại phiếu điểm danh</h3></div><button onClick={() => setReopenOpen(false)} aria-label="Đóng" className="grid h-10 w-10 place-items-center rounded-xl border border-outline-variant/50"><X size={18}/></button></div><p className="mt-3 text-sm leading-6 text-on-surface-variant">Lý do sẽ được lưu cùng người thao tác và thời điểm mở lại.</p><label className="mt-4 block text-sm font-bold">Lý do mở lại<textarea autoFocus rows={4} maxLength={500} value={reopenReason} onChange={event => setReopenReason(event.target.value)} placeholder="Ví dụ: Giáo viên báo học viên mất kết nối Zoom..." className="mt-2 w-full rounded-xl border-outline-variant/60 bg-surface focus:border-primary focus:ring-primary"/></label><div className="mt-5 flex justify-end gap-2"><button onClick={() => setReopenOpen(false)} className="min-h-11 rounded-xl border border-outline-variant/60 px-4 text-sm font-bold">Hủy</button><button disabled={!reopenReason.trim() || busy} onClick={() => void reopen()} className="min-h-11 rounded-xl bg-primary px-4 text-sm font-bold text-on-primary disabled:opacity-40"><LockOpen size={17} className="mr-1 inline"/> Mở lại phiếu</button></div></div></div>}
  </div>;
}

function Metric({ icon: Icon, label, value, note, warning = false }: { icon: typeof Clock; label: string; value: string; note: string; warning?: boolean }) {
  return <div className="flex items-center gap-4 rounded-2xl border border-outline-variant/40 bg-surface p-4"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${warning ? "bg-amber-50 text-amber-800" : "bg-primary-container/20 text-primary"}`}><Icon size={21}/></span><div><p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{label}</p><strong className="mt-0.5 block text-xl font-black tabular-nums">{value}</strong><small className="text-on-surface-variant">{note}</small></div></div>;
}

function MiniStat({ label, value, positive, warning, danger }: { label: string; value: string; positive?: boolean; warning?: boolean; danger?: boolean }) {
  const tone = positive ? "text-emerald-700" : warning ? "text-amber-800" : danger ? "text-rose-700" : "text-primary";
  return <div className="rounded-xl border border-outline-variant/35 bg-surface-container-low/40 px-4 py-3"><span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</span><strong className={`mt-1 block text-lg font-black tabular-nums ${tone}`}>{value}</strong></div>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="grid min-h-[420px] place-items-center p-8 text-center"><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-surface-container text-on-surface-variant"><Timer size={24}/></span><p className="mt-4 text-sm font-semibold text-on-surface-variant">{text}</p></div></div>;
}
