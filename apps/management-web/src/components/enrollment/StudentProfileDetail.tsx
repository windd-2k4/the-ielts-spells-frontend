import {
  CalendarBlank,
  CheckCircle,
  Envelope,
  Info,
  LockKey,
  MapPin,
  NotePencil,
  Phone,
  UserCircle,
  Users,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { Course, Enrollment, StudentDetail, StudentLearningInsights } from "../../academic-types";
import { date } from "../../academic-types";
import { apiFetch } from "../../lib/api";
import StudentProfileLearningOverview from "../student/StudentProfileLearningOverview";

interface StudentProfileDetailProps {
  studentId: string | null;
  onClose?: () => void;
  insights?: StudentLearningInsights | null;
  insightsLoading?: boolean;
  insightsError?: string;
  enrollments?: Enrollment[];
  courses?: Course[];
  onRetryInsights?: () => void;
}

type EditForm = {
  fullName: string;
  email: string;
  phone: string;
  targetBand: string;
  dateOfBirth: string;
  address: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
  notes: string;
};

type EditFormErrors = Partial<Record<keyof EditForm, string>>;

const inputClass =
  "min-h-12 w-full rounded-xl border border-outline-variant/60 bg-surface px-3 py-2.5 text-sm text-on-surface outline-none transition placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/15";

export default function StudentProfileDetail({
  studentId,
  onClose,
  insights,
  insightsLoading,
  insightsError,
  enrollments,
  courses,
  onRetryInsights,
}: StudentProfileDetailProps) {
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    if (!studentId) {
      setStudent(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setStudent(await apiFetch<StudentDetail>(`/admin/students/${studentId}`));
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không tải được hồ sơ học viên");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <ProfileSkeleton />;
  if (error || !student)
    return <State title="Không tải được hồ sơ" text={error || "Không tìm thấy học viên"} action={() => void load()} />;

  const emergency = normalizeEmergencyContact(student.emergencyContact);
  const profileCompleteness = getCompleteness(student);
  const missingFields = getMissingProfileFields(student);

  return (
    <div className="space-y-4">
      {/* Student Profile Header Banner */}
      <header className="profile-saas-panel profile-enter relative overflow-hidden rounded-[20px] border p-5">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-primary-container/10" aria-hidden="true" />
        {onClose && (
          <button
            type="button"
            aria-label="Đóng hồ sơ"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-xl border border-outline-variant/50 bg-surface transition hover:bg-surface-container"
          >
            <X size={18} />
          </button>
        )}
        <div className="relative flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar student={student} />
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-primary-container/30 px-2.5 py-1 font-mono text-xs font-bold text-primary">
                  {student.studentCode}
                </span>
                <span
                  className={`rounded-lg px-2.5 py-1 text-xs font-black ${
                    student.active ? "bg-emerald-50 text-emerald-700" : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {student.active ? "Hồ sơ hoạt động" : "Hồ sơ đã khóa"}
                </span>
                <span className="rounded-lg bg-surface-container-low border border-outline-variant/30 px-2.5 py-1 text-xs font-bold text-on-surface-variant flex items-center gap-1">
                  <CalendarBlank size={14} className="text-primary" /> Gia nhập: {date(student.joinedAt)}
                </span>
              </div>
              <h1 className="truncate font-display text-2xl font-extrabold text-on-surface">
                {student.fullName}
              </h1>
              <p className="mt-1 text-sm text-on-surface-variant">
                {student.email ?? "Chưa có email"} · {student.phone ?? "Chưa có số điện thoại"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-on-primary shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2"
          >
            <NotePencil size={18} /> Chỉnh sửa hồ sơ
          </button>
        </div>

      </header>

      {insights !== undefined && (
        <StudentProfileLearningOverview
          insights={insights}
          loading={insightsLoading ?? false}
          error={insightsError ?? ""}
          enrollments={enrollments ?? []}
          courses={courses ?? []}
          onRetry={onRetryInsights ?? (() => undefined)}
        />
      )}

      <div className="profile-enter profile-enter-delay-3 grid items-start gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
        <Panel icon={<UserCircle size={20} weight="duotone" />} title="Thông tin hồ sơ" description="Thông tin nhận diện, liên hệ và người thân của học viên.">
          <div className="grid gap-3 md:grid-cols-2">
            <InfoRow icon={<Envelope />} label="Email" value={student.email} missing="Chưa có email" />
            <InfoRow icon={<Phone />} label="Số điện thoại" value={student.phone} missing="Chưa có số điện thoại" />
            <InfoRow icon={<CalendarBlank />} label="Ngày sinh" value={student.dateOfBirth ? date(student.dateOfBirth) : null} missing="Chưa cập nhật" />
            <InfoRow icon={<MapPin />} label="Địa chỉ" value={student.address} missing="Chưa cập nhật" />
          </div>

          <div className="mt-4 rounded-xl border border-primary/10 bg-primary-container/10 p-4">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface text-primary"><Users size={17} weight="duotone" /></span>
              <div>
                <h3 className="text-sm font-bold text-on-surface">Liên hệ khẩn cấp</h3>
                <p className="text-xs text-on-surface-variant">Thông tin người thân hoặc người giám hộ.</p>
              </div>
            </div>
            {emergency.hasData ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <InfoRow icon={<UserCircle />} label="Người liên hệ" value={emergency.name} missing="Chưa cập nhật" />
                <InfoRow icon={<Users />} label="Mối quan hệ" value={emergency.relationship} missing="Chưa cập nhật" />
                <InfoRow icon={<Phone />} label="Số điện thoại" value={emergency.phone} missing="Chưa cập nhật" />
              </div>
            ) : (
              <p className="mt-3 rounded-lg bg-surface/75 px-3 py-2 text-sm text-on-surface-variant">Chưa có thông tin liên hệ khẩn cấp.</p>
            )}
          </div>
        </Panel>

        <Panel icon={<CheckCircle size={20} weight="duotone" />} title="Tình trạng hồ sơ" description="Theo dõi nhanh dữ liệu cần bổ sung.">
          <div className="rounded-xl border border-primary/10 bg-primary-container/10 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <strong className="text-3xl tabular-nums text-on-surface">{profileCompleteness}%</strong>
                <span className="ml-2 text-xs font-semibold text-on-surface-variant">đã hoàn thiện</span>
              </div>
              <span className="rounded-lg bg-surface px-2.5 py-1 text-xs font-bold text-primary shadow-sm">{missingFields.length ? `${missingFields.length} mục còn thiếu` : "Đã đầy đủ"}</span>
            </div>
            <div
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface"
              role="progressbar"
              aria-label="Mức độ hoàn thiện hồ sơ"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={profileCompleteness}
            >
              <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${profileCompleteness}%` }} />
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.07em] text-on-surface-variant">{missingFields.length ? "Cần bổ sung" : "Hồ sơ sẵn sàng"}</h3>
            {missingFields.length ? (
              <ul className="mt-2 grid gap-2 text-sm text-on-surface-variant sm:grid-cols-2">
                {missingFields.map(field => (
                  <li key={field} className="flex items-center gap-2 rounded-lg bg-surface-container-low/65 px-3 py-2"><WarningCircle size={16} className="shrink-0 text-amber-600" />{field}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700"><CheckCircle size={17} /> Dữ liệu thiết yếu đã được cập nhật.</p>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-outline-variant/25 bg-surface-container-low/35 p-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.07em] text-on-surface-variant">Ghi chú học vụ</h3>
            <p className={`mt-1 whitespace-pre-wrap text-sm leading-6 ${student.notes ? "text-on-surface" : "text-on-surface-variant"}`}>
              {student.notes || "Chưa có ghi chú học vụ."}
            </p>
          </div>
        </Panel>
      </div>

      {editing && (
        <EditStudentModal
          student={student}
          onClose={() => setEditing(false)}
          onSaved={async () => {
            setEditing(false);
            await load();
          }}
        />
      )}
    </div>
  );
}

function EditStudentModal({ student, onClose, onSaved }: { student: StudentDetail; onClose: () => void; onSaved: () => Promise<void> }) {
  const emergency = normalizeEmergencyContact(student.emergencyContact);
  const initialForm: EditForm = {
    fullName: student.fullName,
    email: student.email ?? "",
    phone: student.phone ?? "",
    targetBand: student.targetBand?.toString() ?? "",
    dateOfBirth: student.dateOfBirth ?? "",
    address: student.address ?? "",
    emergencyName: emergency.name ?? "",
    emergencyRelationship: emergency.relationship ?? "",
    emergencyPhone: emergency.phone ?? "",
    notes: student.notes ?? "",
  };
  const [form, setForm] = useState<EditForm>(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<EditFormErrors>({});
  const dirty = JSON.stringify(form) !== JSON.stringify(initialForm);
  const hasTemporaryContact = isTemporaryEmail(form.email) || isTemporaryPhone(form.phone);

  function update<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm(current => ({ ...current, [key]: value }));
    setFieldErrors(current => ({ ...current, [key]: undefined }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const validation = validateStudentEdit(form, student.currentBand);
    setFieldErrors(validation);
    if (Object.keys(validation).length > 0) {
      setError("Vui lòng kiểm tra lại các trường được đánh dấu.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await apiFetch(`/admin/students/${student.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          targetBand: toNumber(form.targetBand),
          dateOfBirth: form.dateOfBirth || null,
          address: form.address.trim() || null,
          emergencyContact: {
            ...student.emergencyContact,
            name: form.emergencyName.trim() || null,
            relationship: form.emergencyRelationship.trim() || null,
            phone: form.emergencyPhone.trim() || null,
          },
          notes: form.notes.trim() || null,
        }),
      });
      await onSaved();
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không thể cập nhật hồ sơ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-on-background/45 p-4 backdrop-blur-sm"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={submit}
        className="my-6 w-full max-w-5xl overflow-hidden rounded-[22px] border border-outline-variant/40 bg-surface shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-student-title"
      >
        <header className="flex items-start justify-between gap-4 border-b border-outline-variant/25 px-5 py-4 md:px-7">
          <div>
            <span className="text-[11px] font-black uppercase tracking-[0.08em] text-primary">Hồ sơ học viên</span>
            <h2 id="edit-student-title" className="mt-1 font-display text-2xl font-bold">
              Chỉnh sửa hồ sơ học viên
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">Cập nhật thông tin liên hệ và mục tiêu học tập. Mã {student.studentCode} không đổi.</p>
          </div>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-xl border border-outline-variant/50 hover:bg-surface-container"
          >
            <X size={18} />
          </button>
        </header>

        <div className="max-h-[72vh] overflow-y-auto p-5 md:p-7">
          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-outline-variant/35 bg-surface-container-low/45 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-container/25 text-primary"><LockKey size={20} /></span>
              <div>
                <strong className="block text-sm text-on-surface">Trạng thái truy cập được quản lý riêng</strong>
                <p className="mt-0.5 text-xs text-on-surface-variant">Khóa hoặc kích hoạt hồ sơ cần thao tác có lý do và xác nhận, không thực hiện trong form này.</p>
              </div>
            </div>
            <span className={`w-fit rounded-lg px-3 py-1.5 text-xs font-black ${student.active ? "bg-emerald-50 text-emerald-700" : "bg-surface-container text-on-surface-variant"}`}>
              {student.active ? "Đang hoạt động" : "Đã khóa"}
            </span>
          </div>

          <FormSection index="01" title="Thông tin cá nhân" description="Dữ liệu dùng để định danh và liên hệ trực tiếp với học viên.">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Họ và tên" required error={fieldErrors.fullName}>
                <input autoComplete="name" required value={form.fullName} onChange={event => update("fullName", event.target.value)} className={inputClass} />
              </Field>
              <Field label="Ngày sinh" error={fieldErrors.dateOfBirth}>
                <input type="date" max={today()} value={form.dateOfBirth} onChange={event => update("dateOfBirth", event.target.value)} className={inputClass} />
              </Field>
              <Field label="Email" error={fieldErrors.email} hint={isTemporaryEmail(form.email) ? "Email tạm từ dữ liệu seed, cần thay bằng email thật." : undefined}>
                <input autoComplete="email" type="email" value={form.email} onChange={event => update("email", event.target.value)} className={inputClass} />
              </Field>
              <Field label="Số điện thoại" error={fieldErrors.phone} hint={isTemporaryPhone(form.phone) ? "Số điện thoại tạm, chưa dùng để liên hệ." : undefined}>
                <input autoComplete="tel" inputMode="tel" value={form.phone} onChange={event => update("phone", event.target.value)} className={inputClass} />
              </Field>
              <Field label="Địa chỉ" className="md:col-span-2">
                <input autoComplete="street-address" value={form.address} onChange={event => update("address", event.target.value)} className={inputClass} />
              </Field>
            </div>
            {hasTemporaryContact && (
              <div className="mt-4 flex gap-2 rounded-xl border border-amber-300/55 bg-amber-50/70 p-3 text-xs leading-5 text-amber-950">
                <WarningCircle className="mt-0.5 shrink-0" size={17} weight="fill" />
                Hồ sơ còn thông tin liên hệ tạm. Hệ thống vẫn cho lưu để hoàn thiện dần, nhưng không dùng các giá trị này để gửi thông báo.
              </div>
            )}
          </FormSection>

          <FormSection index="02" title="Mục tiêu học tập" description="Band hiện tại phải đến từ bài đầu vào hoặc kết quả đã được giáo viên xác nhận.">
            <div className="grid gap-5 md:grid-cols-2">
              <ReadOnlyMetric label="Band hiện tại" value={student.currentBand} description="Chỉ cập nhật qua luồng đánh giá năng lực có căn cứ." />
              <Field label="Band mục tiêu" error={fieldErrors.targetBand} hint="Nhập theo nấc 0.5 và không thấp hơn Band hiện tại.">
                <input type="number" min="0" max="9" step="0.5" value={form.targetBand} onChange={event => update("targetBand", event.target.value)} className={inputClass} />
              </Field>
              <Field label="Ghi chú học vụ nội bộ" className="md:col-span-2" error={fieldErrors.notes}>
                <textarea rows={4} value={form.notes} onChange={event => update("notes", event.target.value)} className={`${inputClass} resize-y`} placeholder="Ghi lại nhu cầu hỗ trợ, trao đổi với phụ huynh hoặc lưu ý học tập..." />
              </Field>
            </div>
          </FormSection>

          <FormSection index="03" title="Liên hệ khẩn cấp" description="Không bắt buộc. Nếu khai báo, cần đủ họ tên, mối quan hệ và số điện thoại.">
            <div className="grid gap-5 md:grid-cols-3">
              <Field label="Họ tên" error={fieldErrors.emergencyName}>
                <input autoComplete="off" value={form.emergencyName} onChange={event => update("emergencyName", event.target.value)} className={inputClass} />
              </Field>
              <Field label="Mối quan hệ" error={fieldErrors.emergencyRelationship}>
                <input autoComplete="off" value={form.emergencyRelationship} onChange={event => update("emergencyRelationship", event.target.value)} className={inputClass} placeholder="Ví dụ: Mẹ, cha, người giám hộ" />
              </Field>
              <Field label="Số điện thoại" error={fieldErrors.emergencyPhone}>
                <input autoComplete="off" inputMode="tel" value={form.emergencyPhone} onChange={event => update("emergencyPhone", event.target.value)} className={inputClass} />
              </Field>
            </div>
          </FormSection>

          {error && <p className="mt-5 rounded-xl border border-error/25 bg-error-container/15 p-3 text-sm font-semibold text-error">{error}</p>}
        </div>

        <footer className="flex justify-end gap-3 border-t border-outline-variant/25 bg-surface-container-low/35 px-5 py-4 md:px-7">
          <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-outline-variant/55 px-5 py-2.5 font-bold hover:bg-surface-container">
            Hủy
          </button>
          <div className="mr-auto hidden items-center gap-2 text-xs text-on-surface-variant sm:flex">
            <Info size={16} /> Chỉ lưu các thay đổi trong hồ sơ, không thay đổi lịch sử ghi danh.
          </div>
          <button disabled={saving || !dirty} className="min-h-11 rounded-xl bg-primary px-5 py-2.5 font-bold text-on-primary disabled:cursor-not-allowed disabled:opacity-45">
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </footer>
      </form>
    </div>
  );
}

function Panel({ icon, title, description, children }: { icon: ReactNode; title: string; description?: string; children: ReactNode }) {
  return (
    <section className="profile-saas-panel rounded-[18px] border p-5 md:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-container/20 text-primary">{icon}</span>
        <div>
          <h2 className="font-display text-lg font-bold text-on-surface">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-on-surface-variant">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function InfoRow({ icon, label, value, missing }: { icon: ReactNode; label: string; value: string | null | undefined; missing: string }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl border border-outline-variant/25 bg-surface-container-low/35 p-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-container/20 text-primary">{icon}</span>
      <div className="min-w-0">
        <span className="block text-[11px] font-bold uppercase tracking-[0.07em] text-on-surface-variant">{label}</span>
        <span className={`mt-0.5 block break-words text-sm font-bold ${value ? "text-on-surface" : "text-amber-700"}`}>{value || missing}</span>
      </div>
    </div>
  );
}

function Avatar({ student }: { student: StudentDetail }) {
  return student.avatarPath ? (
    <img src={student.avatarPath} alt={`Ảnh đại diện của ${student.fullName}`} className="h-14 w-14 shrink-0 rounded-2xl object-cover" />
  ) : (
    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-container/35 text-xl font-black text-primary">
      {student.fullName.slice(0, 1).toUpperCase()}
    </span>
  );
}

function FormSection({ index, title, description, children }: { index: string; title: string; description: string; children: ReactNode }) {
  return (
    <section className="border-t border-outline-variant/25 py-6 first:border-t-0 first:pt-0">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-container/25 text-xs font-black text-primary">{index}</span>
        <div>
          <h3 className="font-display text-lg font-bold text-on-surface">{title}</h3>
          <p className="mt-1 text-sm text-on-surface-variant">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function ReadOnlyMetric({ label, value, description }: { label: string; value: number | null; description: string }) {
  return (
    <div className="rounded-xl border border-outline-variant/45 bg-surface-container-low/55 px-4 py-3">
      <span className="block text-[11px] font-black uppercase tracking-[0.07em] text-on-surface-variant">{label}</span>
      <div className="mt-1 flex items-center justify-between gap-3">
        <strong className="text-xl tabular-nums text-on-surface">{value ?? "Chưa có"}</strong>
        <LockKey size={18} className="text-on-surface-variant" />
      </div>
      <p className="mt-2 text-xs leading-5 text-on-surface-variant">{description}</p>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  error,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.07em] text-on-surface-variant">
        {label}
        {required && <span className="text-error"> *</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs font-semibold text-error">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs leading-5 text-on-surface-variant">{hint}</span>
      ) : null}
    </label>
  );
}

function State({ title, text, action }: { title: string; text: string; action: () => void }) {
  return (
    <div className="rounded-[20px] border border-error/25 bg-error-container/10 p-10 text-center">
      <strong className="block text-on-surface">{title}</strong>
      <p className="mt-2 text-sm text-error">{text}</p>
      <button onClick={action} className="mt-4 rounded-xl border border-primary/40 px-4 py-2 text-sm font-bold text-primary">
        Thử lại
      </button>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-36 animate-pulse rounded-[22px] bg-surface-container-low" />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="h-72 animate-pulse rounded-[20px] bg-surface-container-low lg:col-span-2" />
        <div className="h-72 animate-pulse rounded-[20px] bg-surface-container-low" />
      </div>
    </div>
  );
}

function normalizeEmergencyContact(value: Record<string, unknown>) {
  const read = (...keys: string[]) => keys.map(key => value?.[key]).find(item => typeof item === "string" && item.trim()) as string | undefined;
  const name = read("name", "fullName", "contactName");
  const relationship = read("relationship", "relation");
  const phone = read("phone", "phoneNumber", "contactPhone");
  return { name, relationship, phone, hasData: Boolean(name || relationship || phone) };
}

function getCompleteness(student: StudentDetail) {
  const emergency = normalizeEmergencyContact(student.emergencyContact);
  const fields = [student.fullName, student.email, student.phone, student.dateOfBirth, student.address, student.currentBand, student.targetBand, emergency.phone];
  return Math.round((fields.filter(value => value !== null && value !== undefined && value !== "").length / fields.length) * 100);
}

function getMissingProfileFields(student: StudentDetail) {
  const emergency = normalizeEmergencyContact(student.emergencyContact);
  return [
    ["Email", student.email],
    ["Số điện thoại", student.phone],
    ["Ngày sinh", student.dateOfBirth],
    ["Địa chỉ", student.address],
    ["Band hiện tại", student.currentBand],
    ["Band mục tiêu", student.targetBand],
    ["Liên hệ khẩn cấp", emergency.phone],
  ].filter(([, value]) => value === null || value === undefined || value === "").map(([label]) => label as string);
}

function toNumber(value: string) {
  return value.trim() === "" ? null : Number(value);
}

function validateStudentEdit(form: EditForm, currentBand: number | null) {
  const errors: EditFormErrors = {};
  const fullName = form.fullName.trim();
  const email = form.email.trim();
  const phone = form.phone.trim();
  const targetBand = toNumber(form.targetBand);
  const emergencyValues = [form.emergencyName.trim(), form.emergencyRelationship.trim(), form.emergencyPhone.trim()];
  const hasEmergencyData = emergencyValues.some(Boolean);

  if (fullName.length < 2) errors.fullName = "Họ và tên cần có ít nhất 2 ký tự.";
  if (email && !isTemporaryEmail(email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Email chưa đúng định dạng.";
  if (phone && !isTemporaryPhone(phone) && !isPhoneNumber(phone)) errors.phone = "Số điện thoại chưa hợp lệ.";
  if (form.dateOfBirth && form.dateOfBirth > today()) errors.dateOfBirth = "Ngày sinh không được ở tương lai.";
  if (targetBand !== null && (!isHalfBand(targetBand) || targetBand < 0 || targetBand > 9)) {
    errors.targetBand = "Band mục tiêu phải từ 0.0 đến 9.0 theo nấc 0.5.";
  } else if (targetBand !== null && currentBand !== null && targetBand < currentBand) {
    errors.targetBand = "Band mục tiêu không được thấp hơn Band hiện tại.";
  }
  if (form.notes.length > 2000) errors.notes = "Ghi chú không được vượt quá 2.000 ký tự.";

  if (hasEmergencyData) {
    if (!emergencyValues[0]) errors.emergencyName = "Cần nhập tên người liên hệ.";
    if (!emergencyValues[1]) errors.emergencyRelationship = "Cần nhập mối quan hệ.";
    if (!emergencyValues[2]) errors.emergencyPhone = "Cần nhập số điện thoại khẩn cấp.";
    else if (!isPhoneNumber(emergencyValues[2])) errors.emergencyPhone = "Số điện thoại khẩn cấp chưa hợp lệ.";
  }
  return errors;
}

function isTemporaryEmail(value: string | null | undefined) {
  return Boolean(value && (value.toLowerCase().endsWith(".local") || value.toLowerCase().includes("@seed.")));
}

function isTemporaryPhone(value: string | null | undefined) {
  if (!value) return false;
  const digits = value.replace(/\D/g, "");
  return digits.length > 0 && (/^0+$/.test(digits) || digits.length < 9);
}

function isPhoneNumber(value: string) {
  const digits = value.replace(/[\s().-]/g, "");
  return /^\+?\d{9,15}$/.test(digits);
}

function isHalfBand(value: number) {
  return Number.isInteger(value * 2);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
