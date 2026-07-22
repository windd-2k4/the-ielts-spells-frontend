import { ArrowLeft, ArrowsLeftRight, CalendarBlank, CheckCircle, PauseCircle, Plus, ShieldCheck } from "@phosphor-icons/react";
import type * as React from "react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import type { AcademicClass, Course, Enrollment, Page, Reservation, StudentDetail, Transfer } from "../academic-types";
import { date, enrollmentStatusLabel } from "../academic-types";
import { Drawer, StatusBadge } from "../components/AdminUi";
import { apiFetch } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import StudentProfileDetail from "../components/enrollment/StudentProfileDetail";

type Dialog = {kind: "reservation" | "transfer"; enrollment: Enrollment} | null;

export function StudentDetailPage() {
  const { studentId = "" } = useParams();
  const { roles } = useAuth();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null);
  
  // Tab layout state
  const [activeTab, setActiveTab] = useState<"profile" | "history">("profile");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [profile, enrollmentPage, classPage, coursePage] = await Promise.all([
        apiFetch<StudentDetail>(`/admin/students/${studentId}`),
        apiFetch<Page<Enrollment>>(`/admin/enrollments?studentId=${studentId}&size=100`),
        apiFetch<Page<AcademicClass>>("/admin/classes?size=100"),
        apiFetch<Page<Course>>("/admin/courses?size=100"),
      ]);
      const lifecycle = await Promise.all(enrollmentPage.content.flatMap(enrollment => [
        apiFetch<Reservation[]>(`/admin/enrollments/${enrollment.id}/reservations`).catch(() => []),
        apiFetch<Transfer[]>(`/admin/enrollments/${enrollment.id}/transfers`).catch(() => []),
      ]));
      setStudent(profile); setEnrollments(enrollmentPage.content); setClasses(classPage.content); setCourses(coursePage.content);
      setReservations(lifecycle.filter((_, index) => index % 2 === 0).flat() as Reservation[]);
      setTransfers(lifecycle.filter((_, index) => index % 2 === 1).flat() as Transfer[]);
    } catch (value) { setError(value instanceof Error ? value.message : "Không tải được hồ sơ học viên"); }
    finally { setLoading(false); }
  }, [studentId]);
  
  useEffect(() => { void load(); }, [load]);

  const classById = (id: string) => classes.find(value => value.id === id);
  const courseName = (classId: string) => { const klass = classById(classId); return courses.find(value => value.id === klass?.courseId)?.name ?? "Khóa học"; };
  const pending = reservations.filter(x => x.status === "PENDING").length + transfers.filter(x => x.status === "PENDING").length;
  const canApprove = roles.some(role => ["admin", "manager"].includes(role));

  if (loading) return <State text="Đang tải hồ sơ học viên..." />;
  if (error || !student) return <State text={error || "Không tìm thấy học viên"} error />;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/students" className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary transition-all">
          <ArrowLeft /> Quay lại danh sách học viên
        </Link>
      </div>

      {/* Tabs navigation */}
      <nav className="flex border-b border-outline-variant/50 overflow-x-auto no-scrollbar gap-2 mb-6">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-5 py-3 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${
            activeTab === "profile"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-primary"
          }`}
        >
          Học bạ chi tiết (Profile)
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-5 py-3 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${
            activeTab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-primary"
          }`}
        >
          Lịch sử khóa học & Học vụ
        </button>
      </nav>

      {activeTab === "profile" && (
        <StudentProfileDetail studentId={studentId} />
      )}

      {activeTab === "history" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-outline-variant/30 bg-surface p-6 shadow-sm md:p-8">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
              <div className="flex items-start gap-4">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary text-2xl font-bold text-on-primary">
                  {student.fullName.slice(0, 1)}
                </div>
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary-container/20 px-3 py-1 text-xs font-bold text-primary">
                      {student.studentCode}
                    </span>
                    <span className="rounded-full bg-tertiary-container/30 px-3 py-1 text-xs font-bold text-on-tertiary-container">
                      {student.active ? "Đang hoạt động" : "Đã khóa"}
                    </span>
                  </div>
                  <h1 className="font-display text-3xl font-bold md:text-4xl">{student.fullName}</h1>
                  <p className="mt-2 text-on-surface-variant">
                    {student.email ?? "Chưa có email"} · {student.phone ?? "Chưa có số điện thoại"}
                  </p>
                </div>
              </div>
              <Link to={`/enrollments?studentId=${student.id}&action=create`} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 font-semibold text-on-primary">
                <Plus /> Xếp vào lớp mới
              </Link>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Band hiện tại" value={String(student.currentBand ?? "—")} />
              <Metric label="Band mục tiêu" value={String(student.targetBand ?? "—")} />
              <Metric label="Khóa đang mở" value={String(enrollments.filter(x => ["ACTIVE", "PAUSED"].includes(x.status)).length)} />
              <Metric label="Yêu cầu chờ xử lý" value={String(pending)} />
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-6">
              <Panel title="Lịch sử khóa học" subtitle="Một học viên có thể tham gia nhiều khóa; từng lượt ghi danh được lưu độc lập.">
                <div className="space-y-3">
                  {enrollments.map(enrollment => {
                    const klass = classById(enrollment.classId);
                    const reservation = reservations.find(x => x.enrollmentId === enrollment.id && x.status === "PENDING");
                    const transfer = transfers.find(x => x.sourceEnrollmentId === enrollment.id && x.status === "PENDING");
                    return (
                      <article key={enrollment.id} className="rounded-2xl border border-outline-variant/30 p-5">
                        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                          <div>
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <StatusBadge value={enrollment.status}>{enrollmentStatusLabel[enrollment.status]}</StatusBadge>
                              {reservation && <Tag>Chờ duyệt bảo lưu</Tag>}
                              {transfer && <Tag>Chờ duyệt chuyển lớp</Tag>}
                            </div>
                            <h3 className="font-display text-lg font-bold">{courseName(enrollment.classId)}</h3>
                            <p className="text-sm text-on-surface-variant">
                              {klass?.name} · {klass?.code} · từ {date(enrollment.startedOn)}
                            </p>
                            {enrollment.notes && <p className="mt-2 text-sm">{enrollment.notes}</p>}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {["ACTIVE", "PAUSED"].includes(enrollment.status) && (
                              <>
                                <button onClick={() => setDialog({kind: "reservation", enrollment})} className="inline-flex items-center gap-2 rounded-full border border-outline-variant/60 px-4 py-2 text-sm font-semibold hover:bg-surface-container">
                                  <PauseCircle /> Bảo lưu
                                </button>
                                <button onClick={() => setDialog({kind: "transfer", enrollment})} className="inline-flex items-center gap-2 rounded-full border border-outline-variant/60 px-4 py-2 text-sm font-semibold hover:bg-surface-container">
                                  <ArrowsLeftRight /> Chuyển lớp
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        {canApprove && (reservation || transfer) && (
                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-low p-3 text-sm">
                            <span>{reservation ? `Bảo lưu: ${reservation.reason}` : `Chuyển lớp: ${transfer?.reason}`}</span>
                            <button onClick={() => void approve(reservation, transfer, load, setError)} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 font-semibold text-on-primary">
                              <CheckCircle /> Duyệt yêu cầu
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                  {!enrollments.length && <State text="Học viên chưa có lượt ghi danh." />}
                </div>
              </Panel>
              <Panel title="Theo dõi học tập" subtitle="Dữ liệu điểm danh, bài tập và 4 kỹ năng sẽ hội tụ tại đây.">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Roadmap icon={<CalendarBlank />} title="Điểm danh theo session" text="Hiển thị tỷ lệ tham dự và dữ liệu đồng bộ Zoom." />
                  <Roadmap icon={<ShieldCheck />} title="Tiến độ 4 kỹ năng" text="Listening, Reading, Writing, Speaking theo từng hoạt động." />
                </div>
              </Panel>
            </div>
            <aside className="space-y-6">
              <Panel title="Thông tin hồ sơ">
                <Info label="Ngày tham gia" value={date(student.joinedAt)} />
                <Info label="Ngày sinh" value={date(student.dateOfBirth)} />
                <Info label="Địa chỉ" value={student.address ?? "Chưa cập nhật"} />
                <Info label="Ghi chú học vụ" value={student.notes ?? "Chưa có ghi chú"} />
              </Panel>
              <Panel title="Nguyên tắc dữ liệu">
                <p className="text-sm leading-6 text-on-surface-variant">
                  Không tạo hồ sơ mới khi học viên đổi lớp hoặc học thêm khóa. Bảo lưu và chuyển lớp phải đi qua yêu cầu có lịch sử phê duyệt.
                </p>
              </Panel>
            </aside>
          </div>
          {dialog && <LifecycleDrawer dialog={dialog} classes={classes} onClose={() => setDialog(null)} onSaved={async () => { setDialog(null); await load(); }} />}
        </div>
      )}
    </section>
  );
}

async function approve(reservation: Reservation | undefined, transfer: Transfer | undefined, reload: () => Promise<void>, setError: (v: string) => void) {
  try {
    if (reservation) await apiFetch(`/admin/enrollments/reservations/${reservation.id}/approve`, {method: "PATCH"});
    else if (transfer) await apiFetch(`/admin/enrollments/transfers/${transfer.id}/approve`, {method: "PATCH"});
    await reload();
  } catch (value) {
    setError(value instanceof Error ? value.message : "Không thể duyệt yêu cầu");
  }
}

function LifecycleDrawer({dialog, classes, onClose, onSaved}: {dialog: NonNullable<Dialog>; classes: AcademicClass[]; onClose: () => void; onSaved: () => Promise<void>}) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [targetClassId, setTargetClassId] = useState("");
  const [expiresOn, setExpiresOn] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const targets = useMemo(() => classes.filter(item => item.id !== dialog.enrollment.classId && ["ENROLLING", "IN_PROGRESS"].includes(item.status)), [classes, dialog.enrollment.classId]);
  
  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const transfer = dialog.kind === "transfer";
      await apiFetch(`/admin/enrollments/${dialog.enrollment.id}/${transfer ? "transfers" : "reservations"}`, {
        method: "POST",
        body: JSON.stringify(
          transfer 
            ? {targetClassId, reason, feeAdjustment: 0, notes: notes || null} 
            : {reason, sessionsConsumed: 0, sessionsRemaining: 0, creditAmount: 0, expiresOn: expiresOn || null, notes: notes || null}
        )
      });
      await onSaved();
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không thể gửi yêu cầu");
    } finally {
      setSaving(false);
    }
  }
  
  return (
    <Drawer title={dialog.kind === "reservation" ? "Tạo yêu cầu bảo lưu" : "Tạo yêu cầu chuyển lớp"} description="Yêu cầu được lưu vào lịch sử và chỉ có hiệu lực sau khi quản lý duyệt." onClose={onClose}>
      <form onSubmit={submit} className="flex h-full flex-col gap-5">
        <div className="flex-1 space-y-4">
          {dialog.kind === "transfer" && (
            <Field label="Lớp đích">
              <select required value={targetClassId} onChange={e => setTargetClassId(e.target.value)} className="input border border-outline-variant/60 rounded-xl px-3 py-2 w-full">
                <option value="">Chọn lớp phù hợp</option>
                {targets.map(item => <option key={item.id} value={item.id}>{item.name} ({item.code})</option>)}
              </select>
            </Field>
          )}
          {dialog.kind === "reservation" && (
            <Field label="Hiệu lực tín chỉ đến ngày">
              <input type="date" value={expiresOn} onChange={e => setExpiresOn(e.target.value)} className="input border border-outline-variant/60 rounded-xl px-3 py-2 w-full" />
            </Field>
          )}
          <Field label="Lý do">
            <textarea required rows={4} value={reason} onChange={e => setReason(e.target.value)} className="input border border-outline-variant/60 rounded-xl px-3 py-2 w-full" placeholder="Ghi rõ căn cứ xử lý..." />
          </Field>
          <Field label="Ghi chú nội bộ">
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} className="input border border-outline-variant/60 rounded-xl px-3 py-2 w-full" />
          </Field>
          {error && <p className="rounded-xl bg-error-container/20 p-3 text-sm text-error">{error}</p>}
        </div>
        <div className="flex justify-end gap-3 border-t border-outline-variant/30 pt-4">
          <button type="button" onClick={onClose} className="rounded-full border px-5 py-2.5 font-semibold">Hủy</button>
          <button disabled={saving} className="rounded-full bg-primary px-5 py-2.5 font-semibold text-on-primary disabled:opacity-50">{saving ? "Đang gửi..." : "Gửi yêu cầu"}</button>
        </div>
      </form>
    </Drawer>
  );
}

function Panel({title, subtitle, children}: {title: string; subtitle?: string; children: React.ReactNode}) { return <section className="rounded-2xl border border-outline-variant/30 bg-surface p-5 shadow-sm md:p-6"><h2 className="font-display text-xl font-bold">{title}</h2>{subtitle && <p className="mb-5 mt-1 text-sm text-on-surface-variant">{subtitle}</p>}<div className={subtitle ? "" : "mt-5"}>{children}</div></section>; }
function Metric({label, value}: {label: string; value: string}) { return <div className="rounded-2xl bg-surface-container-low p-4"><span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{label}</span><strong className="mt-2 block text-2xl">{value}</strong></div>; }
function Info({label, value}: {label: string; value: string}) { return <div className="border-b border-outline-variant/20 py-3 last:border-0"><span className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">{label}</span><span className="mt-1 block text-sm">{value}</span></div>; }
function Tag({children}: {children: React.ReactNode}) { return <span className="rounded-full bg-tertiary-container/40 px-3 py-1 text-xs font-bold">{children}</span>; }
function Roadmap({icon, title, text}: {icon: React.ReactNode; title: string; text: string}) { return <div className="rounded-2xl bg-surface-container-low p-5"><span className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-primary-container/30 text-primary">{icon}</span><h3 className="font-bold">{title}</h3><p className="mt-1 text-sm leading-6 text-on-surface-variant">{text}</p></div>; }
function Field({label, children}: {label: string; children: React.ReactNode}) { return <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">{label}</span>{children}</label>; }
function State({text, error}: {text: string; error?: boolean}) { return <div className={`rounded-2xl border p-10 text-center ${error ? "border-error/30 bg-error-container/10 text-error" : "border-outline-variant/30 text-on-surface-variant"}`}>{text}</div>; }
