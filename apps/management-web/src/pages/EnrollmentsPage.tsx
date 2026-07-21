import { NotePencil } from "@phosphor-icons/react";
import { useCallback, useDeferredValue, useEffect, useMemo, useState, type FormEvent } from "react";
import type { AcademicClass, Enrollment, EnrollmentStatus, Page, StudentSummary } from "../academic-types";
import { enrollmentStatusLabel } from "../academic-types";
import { Drawer, LoadState, PageHeader, PrimaryAction, SearchField, StatusBadge } from "../components/AdminUi";
import { apiFetch } from "../lib/api";

export function EnrollmentsPage() {
  const [items, setItems] = useState<Enrollment[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [classId, setClassId] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Enrollment | null>(null);
  const [studentId, setStudentId] = useState("");
  const [studentQuery, setStudentQuery] = useState("");
  const [studentResults, setStudentResults] = useState<StudentSummary[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<EnrollmentStatus>("ACTIVE");
  const [saving, setSaving] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const suffix = classId === "all" ? "" : `&classId=${classId}`;
      const [enrollmentPage, classPage] = await Promise.all([
        apiFetch<Page<Enrollment>>(`/admin/enrollments?size=100${suffix}`),
        apiFetch<Page<AcademicClass>>("/admin/classes?size=100"),
      ]);
      setItems(enrollmentPage.content); setClasses(classPage.content);
    } catch (value) { setError(value instanceof Error ? value.message : "Không tải được ghi danh"); }
    finally { setLoading(false); }
  }, [classId]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!open || editing || studentQuery.trim().length < 2 || selectedStudent) { setStudentResults([]); return; }
    const timer = window.setTimeout(() => {
      setStudentLoading(true);
      void apiFetch<Page<StudentSummary>>(`/admin/students?q=${encodeURIComponent(studentQuery.trim())}&size=8`)
        .then(page => setStudentResults(page.content))
        .catch(value => setError(value instanceof Error ? value.message : "Không tìm được học viên"))
        .finally(() => setStudentLoading(false));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [editing, open, selectedStudent, studentQuery]);

  const visible = useMemo(() => items.filter(item => `${item.studentId} ${item.notes ?? ""}`.toLowerCase().includes(deferredQuery.toLowerCase())), [items, deferredQuery]);
  const className = (id: string) => { const value = classes.find(item => item.id === id); return value ? `${value.name} (${value.code})` : "Lớp không xác định"; };
  function create() { setEditing(null); setStudentId(""); setStudentQuery(""); setStudentResults([]); setSelectedStudent(null); setNotes(""); setStatus("ACTIVE"); setOpen(true); }
  function edit(item: Enrollment) { setEditing(item); setStudentId(item.studentId); setNotes(item.notes ?? ""); setStatus(item.status); setOpen(true); }
  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      if (editing) await apiFetch(`/admin/enrollments/${editing.id}`, { method: "PATCH", body: JSON.stringify({ status, notes: notes || null }) });
      else await apiFetch("/admin/enrollments", { method: "POST", body: JSON.stringify({ classId: classId === "all" ? classes[0]?.id : classId, studentId, notes: notes || null }) });
      setOpen(false); await load();
    } catch (value) { setError(value instanceof Error ? value.message : "Không thể lưu ghi danh"); }
    finally { setSaving(false); }
  }

  return <section>
    <PageHeader eyebrow="Tuyển sinh và học vụ" title="Quản lý ghi danh" description="Đưa học viên vào đúng lớp, theo dõi trạng thái và lưu ghi chú bàn giao." action={<PrimaryAction onClick={create}>Ghi danh học viên</PrimaryAction>} />
    <div className="admin-toolbar"><SearchField value={query} onChange={setQuery} placeholder="Tìm theo mã học viên hoặc ghi chú" /><label><span>Lớp học</span><select value={classId} onChange={event => setClassId(event.target.value)}><option value="all">Tất cả lớp học</option>{classes.map(item => <option key={item.id} value={item.id}>{item.name} ({item.code})</option>)}</select></label></div>
    <LoadState loading={loading} error={error} empty={!visible.length} onRetry={() => void load()} />
    {!loading && !error && visible.length > 0 && <div className="admin-table-wrap"><table className="academic-table"><thead><tr><th>Học viên</th><th>Lớp học</th><th>Ngày ghi danh</th><th>Trạng thái</th><th>Ghi chú</th><th>Thao tác</th></tr></thead><tbody>{visible.map(item => <tr key={item.id}><td><strong className="uuid-text">{item.studentId}</strong></td><td>{className(item.classId)}</td><td>{new Date(item.enrolledAt).toLocaleString("vi-VN")}</td><td><StatusBadge value={item.status}>{enrollmentStatusLabel[item.status]}</StatusBadge></td><td className="notes-cell">{item.notes || "Không có ghi chú"}</td><td><div className="row-actions"><button aria-label="Cập nhật ghi danh" onClick={() => edit(item)}><NotePencil /></button></div></td></tr>)}</tbody></table></div>}
    {open && <Drawer title={editing ? "Cập nhật ghi danh" : "Ghi danh học viên"} description={editing ? "Điều chỉnh trạng thái hoặc ghi chú của lượt ghi danh." : "Chọn lớp và tìm học viên theo tên, email hoặc số điện thoại."} onClose={() => setOpen(false)}><form className="admin-form" onSubmit={save}>
      {!editing && <><label>Lớp học<select required value={classId === "all" ? classes[0]?.id ?? "" : classId} onChange={event => setClassId(event.target.value)}>{classes.map(item => <option key={item.id} value={item.id}>{item.name} ({item.code})</option>)}</select></label><label>Tìm học viên<input value={studentQuery} onChange={event => { setStudentQuery(event.target.value); setSelectedStudent(null); setStudentId(""); }} placeholder="Nhập tên, email hoặc số điện thoại" autoComplete="off" /><small>Nhập ít nhất 2 ký tự, sau đó chọn đúng học viên trong kết quả.</small></label>{selectedStudent ? <div className="student-selected"><strong>{selectedStudent.fullName}</strong><span>{selectedStudent.studentCode} · {selectedStudent.email || selectedStudent.phone || "Chưa có liên hệ"}</span><button type="button" onClick={() => { setSelectedStudent(null); setStudentId(""); setStudentQuery(""); }}>Chọn lại</button></div> : <div className="student-search-results" aria-live="polite">{studentLoading && <p>Đang tìm học viên...</p>}{!studentLoading && studentQuery.trim().length >= 2 && !studentResults.length && <p>Không có học viên phù hợp.</p>}{studentResults.map(student => <button type="button" key={student.id} onClick={() => { setSelectedStudent(student); setStudentId(student.id); setStudentQuery(student.fullName); setStudentResults([]); }}><strong>{student.fullName}</strong><span>{student.studentCode} · {student.email || student.phone || "Chưa có liên hệ"}</span></button>)}</div>}</>}
      {editing && <label>Trạng thái<select value={status} onChange={event => setStatus(event.target.value as EnrollmentStatus)}>{Object.entries(enrollmentStatusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>}
      <label>Ghi chú<textarea rows={5} value={notes} onChange={event => setNotes(event.target.value)} placeholder="Thông tin bàn giao, nhu cầu đặc biệt..." /></label>{error && <p className="form-error" role="alert">{error}</p>}<footer><button type="button" className="admin-secondary" onClick={() => setOpen(false)}>Hủy</button><button className="admin-primary" disabled={saving || (!editing && (!classes.length || !studentId))}>{saving ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Xác nhận ghi danh"}</button></footer>
    </form></Drawer>}
  </section>;
}
