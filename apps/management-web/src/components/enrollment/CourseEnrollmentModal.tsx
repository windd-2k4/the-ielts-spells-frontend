import {
  ArrowLeft,
  BookOpenText,
  CalendarBlank,
  Check,
  CheckCircle,
  MagnifyingGlass,
  NotePencil,
  SpinnerGap,
  Student,
  UserPlus,
  UsersThree,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import type { Course, Enrollment, Page, StudentSummary } from "../../academic-types";
import { date, money, skillPairLabel } from "../../academic-types";
import { apiFetch } from "../../lib/api";

type Step = 0 | 1 | 2;
type ActivationMode = "PENDING" | "ACTIVE";

type CourseEnrollmentModalProps = {
  course: Course;
  enrollments: Enrollment[];
  open: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

const steps = [
  { label: "Hồ sơ học viên", icon: Student },
  { label: "Điều kiện ghi danh", icon: NotePencil },
  { label: "Kiểm tra", icon: CheckCircle },
] as const;

export default function CourseEnrollmentModal({
  course,
  enrollments,
  open,
  onClose,
  onSaved,
}: CourseEnrollmentModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>(0);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudentSummary[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [notes, setNotes] = useState("");
  const [activationMode, setActivationMode] = useState<ActivationMode>("PENDING");
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const occupied = useMemo(
    () => enrollments.filter(item => ["PENDING", "ACTIVE"].includes(item.status)).length,
    [enrollments],
  );
  const seatsLeft = Math.max(course.capacity - occupied, 0);
  const courseAcceptsEnrollment = course.isActive && !["COMPLETED", "CANCELLED"].includes(course.status);
  const duplicateEnrollment = selectedStudent
    ? enrollments.find(item => item.studentId === selectedStudent.id)
    : undefined;
  const dirty = Boolean(selectedStudent || notes.trim() || activationMode !== "PENDING" || step > 0);

  const reset = useCallback(() => {
    setStep(0);
    setQuery("");
    setResults([]);
    setSelectedStudent(null);
    setSearchError("");
    setNotes("");
    setActivationMode("PENDING");
    setConfirmed(false);
    setSubmitError("");
  }, []);

  const requestClose = useCallback(() => {
    if (saving) return;
    if (dirty && !window.confirm("Hủy ghi danh? Thông tin đang nhập sẽ không được lưu.")) return;
    onClose();
  }, [dirty, onClose, saving]);

  const requestCloseRef = useRef(requestClose);

  useEffect(() => {
    requestCloseRef.current = requestClose;
  }, [requestClose]);

  useEffect(() => {
    if (!open) return;
    reset();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => searchRef.current?.focus(), 80);
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") requestCloseRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, reset]);

  useEffect(() => {
    if (!open || selectedStudent || query.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setSearching(true);
      setSearchError("");
      void apiFetch<Page<StudentSummary>>(
        `/admin/students?q=${encodeURIComponent(query.trim())}&active=true&page=0&size=8`,
      )
        .then(page => setResults(page.content))
        .catch(value => {
          setResults([]);
          setSearchError(value instanceof Error ? value.message : "Không thể tìm học viên.");
        })
        .finally(() => setSearching(false));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [open, query, selectedStudent]);

  function trapFocus(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab" || !dialogRef.current) return;
    const controls = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href]',
      ),
    );
    if (!controls.length) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function selectStudent(student: StudentSummary) {
    setSelectedStudent(student);
    setQuery(student.fullName);
    setResults([]);
    setSearchError("");
    setSubmitError("");
  }

  function clearStudent() {
    setSelectedStudent(null);
    setQuery("");
    setConfirmed(false);
    window.setTimeout(() => searchRef.current?.focus(), 0);
  }

  function canContinue() {
    if (step === 0) return Boolean(selectedStudent) && !duplicateEnrollment;
    if (step === 1) return courseAcceptsEnrollment && seatsLeft > 0 && notes.length <= 2000;
    return confirmed;
  }

  function next() {
    setSubmitError("");
    if (!canContinue()) return;
    setStep(current => Math.min(current + 1, 2) as Step);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!selectedStudent || !confirmed || duplicateEnrollment) return;
    setSaving(true);
    setSubmitError("");
    try {
      const created = await apiFetch<Enrollment>("/admin/enrollments", {
        method: "POST",
        body: JSON.stringify({
          courseId: course.id,
          studentId: selectedStudent.id,
          notes: notes.trim() || null,
        }),
      });
      if (activationMode === "ACTIVE") {
        await apiFetch(`/admin/enrollments/${created.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "ACTIVE", notes: notes.trim() || null }),
        });
      }
      await onSaved();
      onClose();
    } catch (value) {
      setSubmitError(value instanceof Error ? value.message : "Không thể hoàn tất ghi danh.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-[#1d1518]/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-5"
      onMouseDown={event => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-enrollment-title"
        onKeyDown={trapFocus}
        className="flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl border border-outline-variant/45 bg-surface shadow-[0_30px_90px_rgba(66,35,45,0.28)] sm:rounded-3xl"
      >
        <header className="flex items-start justify-between gap-5 border-b border-outline-variant/35 px-5 py-5 sm:px-7">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-bold text-primary">
              <span className="rounded-lg bg-primary-container/25 px-2.5 py-1">{course.code}</span>
              <span>{skillPairLabel[course.skillPair]}</span>
            </div>
            <h2 id="course-enrollment-title" className="font-display text-2xl font-bold tracking-tight text-on-surface">
              Ghi danh học viên
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-on-surface-variant">
              Chọn đúng hồ sơ, kiểm tra điều kiện khóa học và xác nhận trạng thái ban đầu.
            </p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Đóng modal ghi danh"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-outline-variant/55 text-on-surface transition-colors hover:bg-surface-container focus:outline-none focus:ring-4 focus:ring-primary/20"
          >
            <X size={20} />
          </button>
        </header>

        <div className="border-b border-outline-variant/30 bg-surface-container-lowest px-5 py-4 sm:px-7">
          <ol className="grid grid-cols-3 gap-2" aria-label="Tiến trình ghi danh">
            {steps.map((item, index) => {
              const Icon = item.icon;
              const isCurrent = step === index;
              const isDone = step > index;
              return (
                <li key={item.label}>
                  <button
                    type="button"
                    disabled={index > step}
                    onClick={() => index < step && setStep(index as Step)}
                    aria-current={isCurrent ? "step" : undefined}
                    className={`flex min-h-12 w-full items-center gap-2 rounded-xl px-3 text-left text-xs font-bold transition-colors sm:text-sm ${
                      isCurrent
                        ? "bg-primary text-on-primary"
                        : isDone
                          ? "bg-primary-container/25 text-primary hover:bg-primary-container/40"
                          : "text-on-surface-variant"
                    } disabled:cursor-default`}
                  >
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${isCurrent ? "bg-white/15" : "bg-surface"}`}>
                      {isDone ? <Check size={15} weight="bold" /> : <Icon size={16} />}
                    </span>
                    <span className="hidden sm:inline">{item.label}</span>
                    <span className="sm:hidden">{index + 1}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
            {step === 0 && (
              <div className="mx-auto max-w-3xl space-y-5">
                <div>
                  <h3 className="font-display text-xl font-bold text-on-surface">Tìm hồ sơ học viên</h3>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Tìm theo tên, mã học viên, email hoặc số điện thoại. Chỉ hiển thị hồ sơ đang hoạt động.
                  </p>
                </div>

                <label className="block text-sm font-bold text-on-surface">
                  Học viên <span className="text-error">*</span>
                  <span className="relative mt-2 block">
                    <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={19} />
                    <input
                      ref={searchRef}
                      value={query}
                      onChange={event => {
                        setQuery(event.target.value);
                        setSelectedStudent(null);
                        setConfirmed(false);
                      }}
                      disabled={Boolean(selectedStudent)}
                      autoComplete="off"
                      placeholder="Ví dụ: Nguyễn An, HV001, email hoặc số điện thoại"
                      className="min-h-12 w-full rounded-xl border-outline-variant/60 bg-surface pl-11 pr-12 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:ring-primary disabled:bg-surface-container-low"
                    />
                    {searching && <SpinnerGap className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-primary" size={19} />}
                  </span>
                </label>

                {selectedStudent ? (
                  <article className="rounded-2xl border border-primary/30 bg-primary-container/10 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-sm font-bold text-on-primary">
                          {selectedStudent.fullName.trim().charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <h4 className="font-bold text-on-surface">{selectedStudent.fullName}</h4>
                          <p className="mt-0.5 text-xs font-semibold text-primary">{selectedStudent.studentCode}</p>
                          <p className="mt-2 break-words text-sm text-on-surface-variant">
                            {selectedStudent.email || "Chưa có email"}
                            {selectedStudent.phone ? ` • ${selectedStudent.phone}` : ""}
                          </p>
                        </div>
                      </div>
                      <button type="button" onClick={clearStudent} className="min-h-11 shrink-0 rounded-xl px-3 text-sm font-bold text-primary hover:bg-primary-container/25">
                        Chọn lại
                      </button>
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-primary/15 pt-4 text-sm">
                      <div><dt className="text-xs text-on-surface-variant">Band hiện tại</dt><dd className="mt-1 font-bold tabular-nums">{selectedStudent.currentBand ?? "Chưa có"}</dd></div>
                      <div><dt className="text-xs text-on-surface-variant">Band mục tiêu</dt><dd className="mt-1 font-bold tabular-nums">{selectedStudent.targetBand ?? "Chưa có"}</dd></div>
                    </dl>
                    {duplicateEnrollment && (
                      <p className="mt-4 flex items-start gap-2 rounded-xl border border-error/25 bg-error-container/20 p-3 text-sm font-semibold text-error" role="alert">
                        <WarningCircle className="mt-0.5 shrink-0" size={18} />
                        Học viên đã có lượt ghi danh trong khóa này. Hãy mở hồ sơ học viên để cập nhật lượt hiện tại.
                      </p>
                    )}
                  </article>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-outline-variant/45 bg-surface">
                    {searchError && <p className="p-4 text-sm font-semibold text-error" role="alert">{searchError}</p>}
                    {!searching && !searchError && query.trim().length < 2 && (
                      <div className="px-5 py-10 text-center">
                        <Student className="mx-auto text-outline" size={34} />
                        <p className="mt-3 font-bold text-on-surface">Nhập ít nhất 2 ký tự để tìm</p>
                        <p className="mt-1 text-sm text-on-surface-variant">Hệ thống không yêu cầu nhập UUID thủ công.</p>
                      </div>
                    )}
                    {!searching && query.trim().length >= 2 && !results.length && !searchError && (
                      <div className="px-5 py-10 text-center">
                        <p className="font-bold text-on-surface">Không tìm thấy hồ sơ phù hợp</p>
                        <p className="mt-1 text-sm text-on-surface-variant">Tạo hồ sơ học viên trước, sau đó quay lại ghi danh.</p>
                      </div>
                    )}
                    {results.map(student => (
                      <button
                        type="button"
                        key={student.id}
                        onClick={() => selectStudent(student)}
                        className="flex min-h-16 w-full items-center justify-between gap-4 border-b border-outline-variant/25 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-primary-container/10 focus:bg-primary-container/10 focus:outline-none"
                      >
                        <span className="min-w-0">
                          <strong className="block truncate text-sm text-on-surface">{student.fullName}</strong>
                          <span className="mt-1 block truncate text-xs text-on-surface-variant">{student.studentCode} • {student.email || student.phone || "Chưa có liên hệ"}</span>
                        </span>
                        <span className="shrink-0 text-xs font-bold text-primary">Chọn</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 1 && (
              <div className="mx-auto grid max-w-4xl gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-5">
                  <div>
                    <h3 className="font-display text-xl font-bold text-on-surface">Thiết lập lượt ghi danh</h3>
                    <p className="mt-1 text-sm text-on-surface-variant">Chọn trạng thái phù hợp với bước xác nhận học phí hiện tại.</p>
                  </div>

                  <fieldset className="space-y-3">
                    <legend className="text-sm font-bold text-on-surface">Trạng thái sau khi tạo</legend>
                    <label className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition-colors ${activationMode === "PENDING" ? "border-primary bg-primary-container/10" : "border-outline-variant/45 hover:border-primary/40"}`}>
                      <input type="radio" name="activationMode" value="PENDING" checked={activationMode === "PENDING"} onChange={() => setActivationMode("PENDING")} className="mt-1 text-primary focus:ring-primary" />
                      <span><strong className="block text-sm text-on-surface">Chờ xác nhận</strong><span className="mt-1 block text-xs leading-5 text-on-surface-variant">Dùng khi chưa hoàn tất học phí hoặc còn chờ nhân viên học vụ kiểm tra.</span></span>
                    </label>
                    <label className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition-colors ${activationMode === "ACTIVE" ? "border-primary bg-primary-container/10" : "border-outline-variant/45 hover:border-primary/40"}`}>
                      <input type="radio" name="activationMode" value="ACTIVE" checked={activationMode === "ACTIVE"} onChange={() => setActivationMode("ACTIVE")} className="mt-1 text-primary focus:ring-primary" />
                      <span><strong className="block text-sm text-on-surface">Kích hoạt ngay</strong><span className="mt-1 block text-xs leading-5 text-on-surface-variant">Chỉ chọn khi học phí và điều kiện nhập học đã được xác nhận.</span></span>
                    </label>
                  </fieldset>

                  <label className="block text-sm font-bold text-on-surface">
                    Ghi chú bàn giao
                    <textarea
                      rows={5}
                      maxLength={2000}
                      value={notes}
                      onChange={event => setNotes(event.target.value)}
                      placeholder="Nhu cầu đặc biệt, lịch trao đổi, thông tin học phí cần theo dõi..."
                      className="mt-2 w-full resize-none rounded-xl border-outline-variant/60 bg-surface text-sm leading-6 focus:border-primary focus:ring-primary"
                    />
                    <span className="mt-1 flex justify-between text-xs font-normal text-on-surface-variant"><span>Không bắt buộc</span><span className="tabular-nums">{notes.length}/2000</span></span>
                  </label>
                </div>

                <aside className="rounded-2xl border border-outline-variant/40 bg-surface-container-low p-5">
                  <BookOpenText className="text-primary" size={24} />
                  <h4 className="mt-3 font-display text-lg font-bold text-on-surface">{course.name}</h4>
                  <p className="mt-1 text-sm font-semibold text-primary">{course.code}</p>
                  <dl className="mt-5 space-y-4 text-sm">
                    <div className="flex items-start gap-3"><CalendarBlank className="mt-0.5 shrink-0 text-outline" size={18} /><div><dt className="text-xs text-on-surface-variant">Thời gian</dt><dd className="mt-1 font-semibold">{date(course.startsOn)} - {date(course.endsOn)}</dd></div></div>
                    <div className="flex items-start gap-3"><UsersThree className="mt-0.5 shrink-0 text-outline" size={18} /><div><dt className="text-xs text-on-surface-variant">Sĩ số</dt><dd className="mt-1 font-semibold tabular-nums">{occupied}/{course.capacity}, còn {seatsLeft} chỗ</dd></div></div>
                    <div className="flex items-start gap-3"><UserPlus className="mt-0.5 shrink-0 text-outline" size={18} /><div><dt className="text-xs text-on-surface-variant">Cặp kỹ năng</dt><dd className="mt-1 font-semibold">{skillPairLabel[course.skillPair]}</dd></div></div>
                  </dl>
                  {(!courseAcceptsEnrollment || seatsLeft === 0) && (
                    <p className="mt-5 flex gap-2 rounded-xl border border-error/25 bg-error-container/20 p-3 text-sm font-semibold text-error" role="alert"><WarningCircle className="mt-0.5 shrink-0" size={18}/>{seatsLeft === 0 ? "Khóa học đã đủ sĩ số." : "Khóa học không còn nhận ghi danh."}</p>
                  )}
                </aside>
              </div>
            )}

            {step === 2 && selectedStudent && (
              <div className="mx-auto max-w-4xl space-y-5">
                <div>
                  <h3 className="font-display text-xl font-bold text-on-surface">Kiểm tra trước khi ghi danh</h3>
                  <p className="mt-1 text-sm text-on-surface-variant">Đối chiếu hồ sơ và khóa học. Sau khi tạo, mọi thay đổi được lưu trong lịch sử học vụ.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <section className="rounded-2xl border border-outline-variant/40 p-5">
                    <p className="text-xs font-bold text-primary">HỌC VIÊN</p>
                    <h4 className="mt-2 font-display text-lg font-bold">{selectedStudent.fullName}</h4>
                    <p className="mt-1 text-sm text-on-surface-variant">{selectedStudent.studentCode}</p>
                    <p className="mt-4 break-words text-sm">{selectedStudent.email || selectedStudent.phone || "Chưa có thông tin liên hệ"}</p>
                  </section>
                  <section className="rounded-2xl border border-outline-variant/40 p-5">
                    <p className="text-xs font-bold text-primary">KHÓA HỌC</p>
                    <h4 className="mt-2 font-display text-lg font-bold">{course.name}</h4>
                    <p className="mt-1 text-sm text-on-surface-variant">{course.code} • {skillPairLabel[course.skillPair]}</p>
                    <p className="mt-4 text-sm">Học phí: <strong>{money(course.tuitionAmount)}</strong></p>
                  </section>
                </div>
                <section className="rounded-2xl bg-surface-container-low p-5">
                  <dl className="grid gap-4 text-sm sm:grid-cols-3">
                    <div><dt className="text-xs text-on-surface-variant">Trạng thái</dt><dd className="mt-1 font-bold text-primary">{activationMode === "ACTIVE" ? "Đang học" : "Chờ xác nhận"}</dd></div>
                    <div><dt className="text-xs text-on-surface-variant">Ngày ghi danh</dt><dd className="mt-1 font-bold">{new Intl.DateTimeFormat("vi-VN").format(new Date())}</dd></div>
                    <div><dt className="text-xs text-on-surface-variant">Chỗ còn lại sau ghi danh</dt><dd className="mt-1 font-bold tabular-nums">{Math.max(seatsLeft - 1, 0)}</dd></div>
                  </dl>
                  {notes && <div className="mt-4 border-t border-outline-variant/30 pt-4"><p className="text-xs text-on-surface-variant">Ghi chú bàn giao</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6">{notes}</p></div>}
                </section>
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-primary/25 bg-primary-container/10 p-4">
                  <input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} className="mt-1 rounded text-primary focus:ring-primary" />
                  <span className="text-sm leading-6 text-on-surface">Tôi đã kiểm tra đúng học viên, khóa học và trạng thái xử lý ban đầu.</span>
                </label>
              </div>
            )}

            {submitError && <p className="mx-auto mt-5 max-w-4xl rounded-xl border border-error/25 bg-error-container/20 p-3 text-sm font-semibold text-error" role="alert">{submitError}</p>}
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-outline-variant/35 bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <button type="button" onClick={requestClose} className="min-h-11 rounded-xl px-4 text-sm font-bold text-on-surface-variant hover:bg-surface-container">
              Hủy
            </button>
            <div className="flex gap-3">
              {step > 0 && (
                <button type="button" onClick={() => setStep(current => Math.max(current - 1, 0) as Step)} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-outline-variant/55 px-5 text-sm font-bold hover:bg-surface-container sm:flex-none">
                  <ArrowLeft size={17} /> Quay lại
                </button>
              )}
              {step < 2 ? (
                <button type="button" disabled={!canContinue()} onClick={next} className="min-h-11 flex-1 rounded-xl bg-primary px-6 text-sm font-bold text-on-primary transition-opacity disabled:cursor-not-allowed disabled:opacity-45 sm:flex-none">
                  Tiếp tục
                </button>
              ) : (
                <button type="submit" disabled={saving || !confirmed} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-on-primary transition-opacity disabled:cursor-not-allowed disabled:opacity-45 sm:flex-none">
                  {saving ? <><SpinnerGap className="animate-spin" size={18}/> Đang ghi danh</> : <><UserPlus size={18} weight="bold"/> Hoàn tất ghi danh</>}
                </button>
              )}
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}
