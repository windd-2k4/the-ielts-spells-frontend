import {
  Archive,
  ArrowClockwise,
  BookOpenText,
  CalendarBlank,
  Check,
  CheckCircle,
  Clock,
  Exam,
  Eye,
  EyeSlash,
  MagnifyingGlass,
  PaperPlaneTilt,
  SpinnerGap,
  Student,
  WarningCircle,
} from "@phosphor-icons/react";
import type {
  CreateTestAssignmentRequest,
  ReadingAssignmentMode,
  TestAssignment,
} from "@ielts/contracts";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Course, Page } from "../../academic-types";
import type { TestBankItem } from "../../library-types";
import { apiFetch } from "../../lib/api";

type ComposerState = {
  mode: ReadingAssignmentMode;
  opensAt: string;
  closesAt: string;
  maxAttempts: string;
  durationMinutes: string;
  showResultAfterSubmit: boolean;
};

const initialComposer: ComposerState = {
  mode: "PRACTICE",
  opensAt: "",
  closesAt: "",
  maxAttempts: "1",
  durationMinutes: "60",
  showResultAfterSubmit: true,
};

function dateTimeLabel(value: string | null) {
  if (!value) return "Không giới hạn";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function dateTimePayload(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function assignmentStatus(item: TestAssignment) {
  if (item.archivedAt) return { label: "Đã lưu trữ", tone: "muted" } as const;
  const now = Date.now();
  if (item.opensAt && new Date(item.opensAt).getTime() > now) {
    return { label: "Sắp mở", tone: "scheduled" } as const;
  }
  if (item.closesAt && new Date(item.closesAt).getTime() <= now) {
    return { label: "Đã đóng", tone: "closed" } as const;
  }
  return { label: "Đang mở", tone: "active" } as const;
}

function StatusBadge({ assignment }: { assignment: TestAssignment }) {
  const status = assignmentStatus(assignment);
  const classes = {
    active: "border-emerald-200 bg-emerald-50 text-emerald-800",
    scheduled: "border-amber-200 bg-amber-50 text-amber-800",
    closed: "border-outline-variant bg-surface-container-low text-on-surface-variant",
    muted: "border-outline-variant bg-surface-container text-on-surface-variant",
  }[status.tone];

  return (
    <span className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-bold ${classes}`}>
      {status.label}
    </span>
  );
}

function WorkspaceSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-label="Đang tải màn hình giao đề">
      <div className="h-24 animate-pulse rounded-[22px] bg-surface-container" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="h-[520px] animate-pulse rounded-[22px] bg-surface-container" />
        <div className="h-[520px] animate-pulse rounded-[22px] bg-surface-container" />
      </div>
    </div>
  );
}

export function TestAssignmentWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTestId = searchParams.get("testId") ?? "";
  const [courses, setCourses] = useState<Course[]>([]);
  const [tests, setTests] = useState<TestBankItem[]>([]);
  const [assignments, setAssignments] = useState<TestAssignment[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState(searchParams.get("courseId") ?? "");
  const [selectedTestId, setSelectedTestId] = useState(requestedTestId);
  const [testQuery, setTestQuery] = useState("");
  const [historyQuery, setHistoryQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [composer, setComposer] = useState<ComposerState>(initialComposer);
  const [loading, setLoading] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [assignmentError, setAssignmentError] = useState("");
  const [success, setSuccess] = useState("");

  const eligibleCourses = useMemo(
    () => courses.filter((course) => course.isActive && course.skillPair === "LISTENING_READING"),
    [courses],
  );
  const publishedTests = useMemo(
    () => tests.filter((test) => test.status === "PUBLISHED" && test.publishedVersion),
    [tests],
  );
  const selectedCourse = eligibleCourses.find((course) => course.id === selectedCourseId) ?? null;
  const selectedTest = publishedTests.find((test) => test.id === selectedTestId) ?? null;

  const filteredTests = useMemo(() => {
    const normalized = testQuery.trim().toLocaleLowerCase("vi");
    if (!normalized) return publishedTests;
    return publishedTests.filter((test) =>
      `${test.code} ${test.title} ${test.tags.join(" ")}`.toLocaleLowerCase("vi").includes(normalized),
    );
  }, [publishedTests, testQuery]);

  const filteredAssignments = useMemo(() => {
    const normalized = historyQuery.trim().toLocaleLowerCase("vi");
    return assignments.filter((item) => {
      if (!showArchived && item.archivedAt) return false;
      return !normalized || `${item.testTitle} ${item.versionLabel} ${item.mode}`
        .toLocaleLowerCase("vi")
        .includes(normalized);
    });
  }, [assignments, historyQuery, showArchived]);

  const openCount = assignments.filter((item) => assignmentStatus(item).tone === "active").length;
  const scheduledCount = assignments.filter((item) => assignmentStatus(item).tone === "scheduled").length;

  const loadAssignments = useCallback(async (courseId: string) => {
    if (!courseId) {
      setAssignments([]);
      return;
    }
    setLoadingAssignments(true);
    setAssignmentError("");
    try {
      setAssignments(await apiFetch<TestAssignment[]>(`/admin/test-assignments?courseId=${encodeURIComponent(courseId)}`));
    } catch (value) {
      setAssignments([]);
      setAssignmentError(value instanceof Error ? value.message : "Không tải được lịch sử giao đề.");
    } finally {
      setLoadingAssignments(false);
    }
  }, []);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [coursePage, testPage] = await Promise.all([
        apiFetch<Page<Course>>("/admin/courses?active=true&size=100&sort=startsOn,desc"),
        apiFetch<Page<TestBankItem>>("/admin/test-bank?skill=READING&status=PUBLISHED&size=100"),
      ]);
      setCourses(coursePage.content);
      setTests(testPage.content);

      const availableCourses = coursePage.content.filter(
        (course) => course.isActive && course.skillPair === "LISTENING_READING",
      );
      const nextCourseId = selectedCourseId && availableCourses.some((course) => course.id === selectedCourseId)
        ? selectedCourseId
        : availableCourses[0]?.id ?? "";
      setSelectedCourseId(nextCourseId);
      if (nextCourseId) await loadAssignments(nextCourseId);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không tải được dữ liệu giao đề.");
    } finally {
      setLoading(false);
    }
  }, [loadAssignments, selectedCourseId]);

  useEffect(() => {
    void loadWorkspace();
    // Initial workspace hydration only. Course changes are handled separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedTest) return;
    setComposer((current) => ({
      ...current,
      durationMinutes: String(selectedTest.durationMinutes || 60),
    }));
  }, [selectedTest]);

  function changeCourse(courseId: string) {
    setSelectedCourseId(courseId);
    setSuccess("");
    setAssignmentError("");
    const params = new URLSearchParams(searchParams);
    courseId ? params.set("courseId", courseId) : params.delete("courseId");
    setSearchParams(params, { replace: true });
    void loadAssignments(courseId);
  }

  function selectTest(testId: string) {
    setSelectedTestId(testId);
    setSuccess("");
    const params = new URLSearchParams(searchParams);
    params.set("testId", testId);
    setSearchParams(params, { replace: true });
  }

  function validateComposer() {
    if (!selectedCourseId) return "Vui lòng chọn khóa học nhận đề.";
    if (!selectedTest?.publishedVersion) return "Vui lòng chọn một đề Reading đã xuất bản.";
    const maxAttempts = Number(composer.maxAttempts);
    if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 10) {
      return "Số lượt làm phải từ 1 đến 10.";
    }
    const durationMinutes = Number(composer.durationMinutes);
    if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 240) {
      return "Thời lượng phải từ 1 đến 240 phút.";
    }
    if (composer.opensAt && composer.closesAt && new Date(composer.closesAt) <= new Date(composer.opensAt)) {
      return "Thời điểm đóng bài phải sau thời điểm mở bài.";
    }
    return "";
  }

  async function submitAssignment() {
    const validationMessage = validateComposer();
    if (validationMessage) {
      setAssignmentError(validationMessage);
      return;
    }
    if (!selectedTest?.publishedVersion) return;

    setSubmitting(true);
    setAssignmentError("");
    setSuccess("");
    const body: CreateTestAssignmentRequest = {
      testVersionId: selectedTest.publishedVersion.id,
      courseId: selectedCourseId,
      opensAt: dateTimePayload(composer.opensAt),
      closesAt: dateTimePayload(composer.closesAt),
      maxAttempts: Number(composer.maxAttempts),
      mode: composer.mode,
      durationSeconds: Number(composer.durationMinutes) * 60,
      showResultAfterSubmit: composer.showResultAfterSubmit,
    };

    try {
      const created = await apiFetch<TestAssignment>("/admin/test-assignments", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setAssignments((current) => [created, ...current]);
      setSuccess(`Đã giao “${created.testTitle}” cho ${created.courseName}.`);
      setSelectedTestId("");
      setTestQuery("");
      setComposer(initialComposer);
      const params = new URLSearchParams(searchParams);
      params.delete("testId");
      setSearchParams(params, { replace: true });
    } catch (value) {
      setAssignmentError(value instanceof Error ? value.message : "Không thể giao đề lúc này.");
    } finally {
      setSubmitting(false);
    }
  }

  async function archiveAssignment(item: TestAssignment) {
    const confirmed = window.confirm(
      `Lưu trữ “${item.testTitle}”? Học viên sẽ không thể bắt đầu lượt làm mới từ bài giao này.`,
    );
    if (!confirmed) return;

    setArchivingId(item.id);
    setAssignmentError("");
    try {
      await apiFetch<void>(`/admin/test-assignments/${item.id}`, { method: "DELETE" });
      setAssignments((current) => current.map((value) => (
        value.id === item.id ? { ...value, archivedAt: new Date().toISOString() } : value
      )));
      setSuccess(`Đã lưu trữ bài giao “${item.testTitle}”.`);
    } catch (value) {
      setAssignmentError(value instanceof Error ? value.message : "Không thể lưu trữ bài giao.");
    } finally {
      setArchivingId(null);
    }
  }

  if (loading) return <WorkspaceSkeleton />;

  if (error) {
    return (
      <section className="mx-auto max-w-[1440px] rounded-[22px] border border-error/25 bg-error-container/35 p-6" role="alert">
        <div className="flex items-start gap-3">
          <WarningCircle size={24} weight="fill" className="mt-0.5 shrink-0 text-error" />
          <div>
            <h1 className="font-display text-xl font-bold text-on-error-container">Không tải được màn hình giao đề</h1>
            <p className="mt-1 text-sm text-on-error-container">{error}</p>
            <button
              type="button"
              onClick={() => void loadWorkspace()}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-error px-4 text-sm font-bold text-on-error transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error"
            >
              <ArrowClockwise size={18} /> Thử lại
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <header className="grid gap-5 rounded-[22px] border border-outline-variant/55 bg-surface-container-lowest p-5 shadow-[0_12px_36px_rgba(90,56,68,0.06)] lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.55fr)] lg:p-6">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-fixed text-on-primary-fixed-variant">
            <PaperPlaneTilt size={25} weight="duotone" />
          </span>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Vận hành học vụ</p>
            <h1 className="mt-1 font-display text-2xl font-extrabold tracking-[-0.02em] text-on-surface sm:text-3xl">
              Giao đề Reading
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
              Chọn đúng phiên bản đã xuất bản, thiết lập thời gian và kiểm soát cách học viên xem kết quả.
            </p>
          </div>
        </div>

        <label className="self-center">
          <span className="mb-2 block text-xs font-bold text-on-surface-variant">Khóa học nhận đề</span>
          <select
            value={selectedCourseId}
            onChange={(event) => changeCourse(event.target.value)}
            className="min-h-12 w-full rounded-xl border-outline-variant bg-surface px-3.5 text-sm font-bold text-on-surface shadow-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            <option value="">Chọn khóa học</option>
            {eligibleCourses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.name}
              </option>
            ))}
          </select>
          {eligibleCourses.length === 0 && (
            <span className="mt-2 block text-xs text-error">Chưa có khóa Listening + Reading đang hoạt động.</span>
          )}
        </label>
      </header>

      <section aria-label="Tổng quan giao đề" className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Đề đã xuất bản", value: publishedTests.length, icon: Exam },
          { label: "Đang mở", value: openCount, icon: CheckCircle },
          { label: "Sắp mở", value: scheduledCount, icon: CalendarBlank },
        ].map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="flex min-h-24 items-center gap-4 rounded-2xl border border-outline-variant/50 bg-surface-container-lowest px-5 py-4">
              <Icon size={22} weight="duotone" className="text-primary" />
              <div>
                <strong className="block font-display text-2xl font-extrabold text-on-surface">{metric.value}</strong>
                <span className="text-xs font-semibold text-on-surface-variant">{metric.label}</span>
              </div>
            </div>
          );
        })}
      </section>

      {(success || assignmentError) && (
        <div
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
            assignmentError
              ? "border-error/25 bg-error-container/35 text-on-error-container"
              : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
          role={assignmentError ? "alert" : "status"}
          aria-live="polite"
        >
          {assignmentError
            ? <WarningCircle size={20} weight="fill" className="mt-0.5 shrink-0" />
            : <CheckCircle size={20} weight="fill" className="mt-0.5 shrink-0" />}
          <span>{assignmentError || success}</span>
        </div>
      )}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.32fr)_minmax(340px,0.68fr)]">
        <div className="overflow-hidden rounded-[22px] border border-outline-variant/55 bg-surface-container-lowest">
          <div className="border-b border-outline-variant/45 px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-extrabold text-on-surface">Chọn đề đã xuất bản</h2>
                <p className="mt-1 text-xs text-on-surface-variant">Bản giao sẽ ghim đúng phiên bản, không thay đổi khi đề có bản mới.</p>
              </div>
              <span className="text-xs font-bold text-primary">{filteredTests.length} đề</span>
            </div>
            <label className="relative mt-4 block">
              <span className="sr-only">Tìm đề Reading</span>
              <MagnifyingGlass aria-hidden="true" size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                value={testQuery}
                onChange={(event) => setTestQuery(event.target.value)}
                placeholder="Tìm theo mã đề, tiêu đề hoặc tag"
                className="min-h-11 w-full rounded-xl border-outline-variant bg-surface-container-low px-10 text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </label>
          </div>

          <div className="custom-scrollbar max-h-[470px] overflow-y-auto p-3" aria-label="Đề Reading đã xuất bản">
            {filteredTests.length === 0 ? (
              <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-outline-variant bg-surface-container-low p-6 text-center">
                <div>
                  <BookOpenText size={30} weight="duotone" className="mx-auto text-primary" />
                  <h3 className="mt-3 font-display text-base font-bold text-on-surface">Không có đề phù hợp</h3>
                  <p className="mt-1 text-sm text-on-surface-variant">Hãy xuất bản đề Reading trong Ngân hàng đề trước khi giao.</p>
                </div>
              </div>
            ) : filteredTests.map((test) => {
              const selected = selectedTestId === test.id;
              return (
                <button
                  key={test.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => selectTest(test.id)}
                  className={`mb-2 grid min-h-[92px] w-full grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-2xl border p-4 text-left transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    selected
                      ? "border-primary bg-primary-fixed/45 shadow-[inset_4px_0_0_#894c5b]"
                      : "border-outline-variant/55 bg-surface hover:-translate-y-px hover:border-primary/45 hover:bg-surface-container-low"
                  }`}
                >
                  <span className={`mt-0.5 grid h-9 w-9 place-items-center rounded-xl ${selected ? "bg-primary text-on-primary" : "bg-primary-fixed text-on-primary-fixed-variant"}`}>
                    {selected ? <Check size={18} weight="bold" /> : <Exam size={19} weight="duotone" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-extrabold text-on-surface">{test.title}</span>
                    <span className="mt-1 block text-xs text-on-surface-variant">
                      {test.code} · {test.totalQuestions} câu · {test.durationMinutes} phút
                    </span>
                    <span className="mt-2 inline-flex rounded-full bg-surface-container px-2 py-1 text-[11px] font-bold text-primary">
                      {test.publishedVersion?.versionLabel}
                    </span>
                  </span>
                  <span className="text-right text-[11px] font-semibold text-on-surface-variant">
                    {new Intl.DateTimeFormat("vi-VN").format(new Date(test.publishedVersion!.publishedAt))}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="rounded-[22px] border border-outline-variant/55 bg-surface-container-lowest p-5 xl:sticky xl:top-4 xl:self-start">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-fixed text-on-primary-fixed-variant">
              <Clock size={21} weight="duotone" />
            </span>
            <div>
              <h2 className="font-display text-lg font-extrabold text-on-surface">Cấu hình bài giao</h2>
              <p className="mt-1 text-xs leading-5 text-on-surface-variant">Thiết lập quyền làm bài cho toàn bộ học viên đang ghi danh.</p>
            </div>
          </div>

          <fieldset className="mt-5">
            <legend className="text-xs font-bold text-on-surface-variant">Chế độ làm bài</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {([
                ["PRACTICE", "Luyện tập", "Xem kết quả theo cấu hình"],
                ["EXAM", "Thi thử", "Mô phỏng điều kiện thi"],
              ] as const).map(([value, label, helper]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={composer.mode === value}
                  onClick={() => setComposer((current) => ({ ...current, mode: value }))}
                  className={`min-h-[76px] rounded-xl border p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    composer.mode === value
                      ? "border-primary bg-primary-fixed/45"
                      : "border-outline-variant bg-surface hover:bg-surface-container-low"
                  }`}
                >
                  <span className="block text-sm font-extrabold text-on-surface">{label}</span>
                  <span className="mt-1 block text-[11px] leading-4 text-on-surface-variant">{helper}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <label>
              <span className="mb-1.5 block text-xs font-bold text-on-surface-variant">Mở bài</span>
              <input
                type="datetime-local"
                value={composer.opensAt}
                onChange={(event) => setComposer((current) => ({ ...current, opensAt: event.target.value }))}
                className="min-h-11 w-full rounded-xl border-outline-variant bg-surface text-sm text-on-surface focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
              <span className="mt-1 block text-[11px] text-on-surface-variant">Để trống nếu mở ngay.</span>
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-bold text-on-surface-variant">Đóng bài</span>
              <input
                type="datetime-local"
                value={composer.closesAt}
                onChange={(event) => setComposer((current) => ({ ...current, closesAt: event.target.value }))}
                className="min-h-11 w-full rounded-xl border-outline-variant bg-surface text-sm text-on-surface focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
              <span className="mt-1 block text-[11px] text-on-surface-variant">Để trống nếu không giới hạn.</span>
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-bold text-on-surface-variant">Số lượt làm</span>
              <input
                type="number"
                min={1}
                max={10}
                inputMode="numeric"
                value={composer.maxAttempts}
                onChange={(event) => setComposer((current) => ({ ...current, maxAttempts: event.target.value }))}
                className="min-h-11 w-full rounded-xl border-outline-variant bg-surface text-sm text-on-surface focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-bold text-on-surface-variant">Thời lượng (phút)</span>
              <input
                type="number"
                min={1}
                max={240}
                inputMode="numeric"
                value={composer.durationMinutes}
                onChange={(event) => setComposer((current) => ({ ...current, durationMinutes: event.target.value }))}
                className="min-h-11 w-full rounded-xl border-outline-variant bg-surface text-sm text-on-surface focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </label>
          </div>

          <label className="mt-4 flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-xl border border-outline-variant bg-surface p-3.5">
            <span className="flex items-start gap-3">
              {composer.showResultAfterSubmit
                ? <Eye size={19} className="mt-0.5 shrink-0 text-primary" />
                : <EyeSlash size={19} className="mt-0.5 shrink-0 text-on-surface-variant" />}
              <span>
                <span className="block text-sm font-bold text-on-surface">Hiện kết quả sau khi nộp</span>
                <span className="mt-0.5 block text-[11px] leading-4 text-on-surface-variant">Học viên xem điểm và đáp án sau khi hoàn thành.</span>
              </span>
            </span>
            <input
              type="checkbox"
              checked={composer.showResultAfterSubmit}
              onChange={(event) => setComposer((current) => ({ ...current, showResultAfterSubmit: event.target.checked }))}
              className="h-5 w-5 shrink-0 rounded border-outline text-primary focus:ring-primary"
            />
          </label>

          <dl className="mt-5 space-y-2 rounded-2xl bg-surface-container-low p-4 text-xs">
            <div className="flex justify-between gap-4">
              <dt className="text-on-surface-variant">Khóa học</dt>
              <dd className="max-w-[60%] truncate text-right font-bold text-on-surface">{selectedCourse?.name ?? "Chưa chọn"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-on-surface-variant">Đề thi</dt>
              <dd className="max-w-[60%] truncate text-right font-bold text-on-surface">{selectedTest?.title ?? "Chưa chọn"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-on-surface-variant">Phiên bản</dt>
              <dd className="font-bold text-primary">{selectedTest?.publishedVersion?.versionLabel ?? "Chưa chọn"}</dd>
            </div>
          </dl>

          <button
            type="button"
            onClick={() => void submitAssignment()}
            disabled={submitting || !selectedCourseId || !selectedTest}
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-extrabold text-on-primary transition duration-200 hover:bg-on-primary-container active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {submitting ? <SpinnerGap size={19} className="animate-spin" /> : <PaperPlaneTilt size={19} weight="bold" />}
            {submitting ? "Đang giao đề..." : "Giao đề cho khóa học"}
          </button>
        </aside>
      </section>

      <section className="overflow-hidden rounded-[22px] border border-outline-variant/55 bg-surface-container-lowest">
        <div className="flex flex-col gap-4 border-b border-outline-variant/45 p-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-display text-lg font-extrabold text-on-surface">Lịch sử giao đề</h2>
            <p className="mt-1 text-xs text-on-surface-variant">
              {selectedCourse ? `${selectedCourse.code} - ${selectedCourse.name}` : "Chọn khóa học để xem bài đã giao."}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="relative block">
              <span className="sr-only">Tìm trong lịch sử giao đề</span>
              <MagnifyingGlass size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                value={historyQuery}
                onChange={(event) => setHistoryQuery(event.target.value)}
                placeholder="Tìm bài đã giao"
                className="min-h-10 w-full rounded-xl border-outline-variant bg-surface pl-9 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 sm:w-56"
              />
            </label>
            <label className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-outline-variant bg-surface px-3 text-xs font-bold text-on-surface">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(event) => setShowArchived(event.target.checked)}
                className="rounded border-outline text-primary focus:ring-primary"
              />
              Hiện đã lưu trữ
            </label>
          </div>
        </div>

        {loadingAssignments ? (
          <div className="grid min-h-52 place-items-center" role="status">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant">
              <SpinnerGap size={20} className="animate-spin text-primary" /> Đang tải bài đã giao...
            </span>
          </div>
        ) : !selectedCourseId ? (
          <div className="grid min-h-52 place-items-center p-6 text-center">
            <div>
              <Student size={30} weight="duotone" className="mx-auto text-primary" />
              <p className="mt-3 text-sm font-bold text-on-surface">Chưa chọn khóa học</p>
              <p className="mt-1 text-xs text-on-surface-variant">Chọn khóa học ở đầu trang để xem lịch sử.</p>
            </div>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="grid min-h-52 place-items-center p-6 text-center">
            <div>
              <PaperPlaneTilt size={30} weight="duotone" className="mx-auto text-primary" />
              <p className="mt-3 text-sm font-bold text-on-surface">Chưa có đề nào được giao</p>
              <p className="mt-1 text-xs text-on-surface-variant">Chọn đề ở phía trên và hoàn tất cấu hình đầu tiên.</p>
            </div>
          </div>
        ) : (
          <div className="custom-scrollbar overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead className="bg-surface-container-low text-xs text-on-surface-variant">
                <tr>
                  <th className="px-5 py-3 font-bold">Đề đã giao</th>
                  <th className="px-4 py-3 font-bold">Chế độ</th>
                  <th className="px-4 py-3 font-bold">Thời gian</th>
                  <th className="px-4 py-3 font-bold">Thiết lập</th>
                  <th className="px-4 py-3 font-bold">Trạng thái</th>
                  <th className="px-5 py-3 text-right font-bold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {filteredAssignments.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-surface-container-low/65">
                    <td className="px-5 py-4">
                      <strong className="block max-w-xs truncate text-sm text-on-surface">{item.testTitle}</strong>
                      <span className="mt-1 block text-xs font-semibold text-primary">{item.versionLabel}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-bold text-on-surface">{item.mode === "EXAM" ? "Thi thử" : "Luyện tập"}</span>
                    </td>
                    <td className="px-4 py-4 text-xs leading-5 text-on-surface-variant">
                      <span className="block">Mở: {dateTimeLabel(item.opensAt)}</span>
                      <span className="block">Đóng: {dateTimeLabel(item.closesAt)}</span>
                    </td>
                    <td className="px-4 py-4 text-xs leading-5 text-on-surface-variant">
                      <span className="block">{item.maxAttempts} lượt</span>
                      <span className="block">{item.durationSeconds ? `${Math.round(item.durationSeconds / 60)} phút` : "Theo thời lượng đề"}</span>
                    </td>
                    <td className="px-4 py-4"><StatusBadge assignment={item} /></td>
                    <td className="px-5 py-4 text-right">
                      {!item.archivedAt && (
                        <button
                          type="button"
                          onClick={() => void archiveAssignment(item)}
                          disabled={archivingId === item.id}
                          className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-bold text-error transition hover:bg-error-container/45 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error"
                        >
                          {archivingId === item.id
                            ? <SpinnerGap size={17} className="animate-spin" />
                            : <Archive size={17} />}
                          Lưu trữ
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
