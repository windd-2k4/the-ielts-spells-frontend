import {
  Archive,
  ArrowClockwise,
  BookOpenText,
  Buildings,
  CalendarBlank,
  CaretLeft,
  CaretRight,
  Check,
  CheckCircle,
  Clock,
  Exam,
  Eye,
  EyeSlash,
  Headphones,
  MagnifyingGlass,
  Microphone,
  PaperPlaneTilt,
  PencilSimpleLine,
  Rows,
  SpinnerGap,
  SquaresFour,
  Student,
  Timer,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import type {
  CreateTestAssignmentRequest,
  ReadingAssignmentMode,
  TestAssignment,
} from "@ielts/contracts";
import {
  UNLIMITED_ASSIGNMENT_ATTEMPTS,
  hasUnlimitedAssignmentAttempts,
} from "@ielts/contracts";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import type { ClassSession, Course, Page } from "../../academic-types";
import type { TestBankSummary } from "../../library-types";
import { apiFetch } from "../../lib/api";
import AuthenticatedMediaImage from "../test-builder/AuthenticatedMediaImage";

type AssignmentSkill = "LISTENING" | "READING" | "WRITING" | "SPEAKING";
type WizardStep = "SELECT" | "CONFIGURE" | "CONFIRM";
type DeadlinePreset = "3_DAYS" | "1_WEEK" | "2_WEEKS" | "CUSTOM";
type TestView = "GRID" | "LIST";

type ComposerState = {
  mode: ReadingAssignmentMode;
  maxAttempts: string;
  closesAt: string;
  showResultAfterSubmit: boolean;
};

const DAY_MS = 86_400_000;
const TESTS_PER_PAGE = 10;
const FORMAT_LABELS: Record<string, string> = {
  PASSAGE_1: "Reading Passage 1",
  PASSAGE_2: "Reading Passage 2",
  PASSAGE_3: "Reading Passage 3",
  SECTION_1: "Listening Section 1",
  SECTION_2: "Listening Section 2",
  SECTION_3: "Listening Section 3",
  SECTION_4: "Listening Section 4",
  TASK_1: "Writing Task 1",
  TASK_2: "Writing Task 2",
  PART_1: "Speaking Part 1",
  PART_2: "Speaking Part 2",
  PART_3: "Speaking Part 3",
};

function toDateTimeLocal(date: Date) {
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function createInitialComposer(): ComposerState {
  return {
    mode: "PRACTICE",
    maxAttempts: String(UNLIMITED_ASSIGNMENT_ATTEMPTS),
    closesAt: toDateTimeLocal(new Date(Date.now() + DAY_MS * 7)),
    showResultAfterSubmit: true,
  };
}

function dateTimePayload(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function dateTimeLabel(value: string | null) {
  if (!value) return "Không đặt hạn";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function dateLabel(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function skillLabel(skill: AssignmentSkill) {
  return skill === "READING"
    ? "Reading"
    : skill === "LISTENING"
      ? "Listening"
      : skill === "WRITING"
        ? "Writing"
        : "Speaking";
}

function skillIcon(skill: AssignmentSkill) {
  return skill === "READING"
    ? BookOpenText
    : skill === "LISTENING"
      ? Headphones
      : skill === "WRITING"
        ? PencilSimpleLine
        : Microphone;
}

function coursePairForSkill(skill: AssignmentSkill) {
  return skill === "READING" || skill === "LISTENING"
    ? "LISTENING_READING"
    : "SPEAKING_WRITING";
}

function formatLabelOf(test: TestBankSummary) {
  if (test.testType === "FULL_TEST" || test.sectionsCount > 1) return "Full đề";
  if (test.format && FORMAT_LABELS[test.format]) return FORMAT_LABELS[test.format];
  return "Bài lẻ";
}

function testImageOf(test: TestBankSummary) {
  return test.writingTaskImage?.fileUrl || test.coverImage?.fileUrl || "";
}

function TestArtwork({ test, className }: { test: TestBankSummary; className: string }) {
  const imageUrl = testImageOf(test);
  const Icon = skillIcon(test.skill as AssignmentSkill);
  if (imageUrl) {
    return (
      <span className={`${className} block overflow-hidden bg-surface-container-low`}>
        <AuthenticatedMediaImage
          fileUrl={imageUrl}
          alt={test.writingTaskImage?.altText || test.coverImage?.altText || `Ảnh minh họa đề ${test.title}`}
          className="block h-full w-full object-cover"
        />
      </span>
    );
  }
  return (
    <span className={`${className} flex items-center justify-center overflow-hidden bg-surface-container-low text-primary`} aria-label={`Đề ${skillLabel(test.skill as AssignmentSkill)} chưa có ảnh minh họa`}>
      <span className="grid size-12 place-items-center rounded-2xl border border-primary/15 bg-surface/80 shadow-sm"><Icon size={25} weight="duotone" /></span>
    </span>
  );
}

function CourseArtwork({ course, className }: { course: Course; className: string }) {
  if (course.coverImageUrl) {
    return <span className={`${className} block overflow-hidden bg-surface-container-low`}><AuthenticatedMediaImage fileUrl={course.coverImageUrl} alt={course.coverImageAltText || `Ảnh khóa học ${course.name}`} className="block h-full w-full object-cover" /></span>;
  }
  return (
    <span className={`${className} grid place-items-center overflow-hidden bg-surface-container-low text-primary`} aria-label={`Khóa học ${course.name} chưa có ảnh minh họa`}>
      <Buildings size={32} weight="duotone" />
    </span>
  );
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
    closed: "border-slate-200 bg-slate-100 text-slate-600",
    muted: "border-slate-200 bg-slate-50 text-slate-500",
  }[status.tone];

  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-bold ${classes}`}>
      {status.label}
    </span>
  );
}

function WorkspaceSkeleton() {
  return (
    <div className="mx-auto max-w-[1500px] space-y-3" role="status" aria-label="Đang tải màn hình giao đề">
      <div className="h-28 animate-pulse rounded-2xl bg-surface-container" />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="h-[540px] animate-pulse rounded-2xl bg-surface-container" />
        <div className="h-[540px] animate-pulse rounded-2xl bg-surface-container" />
      </div>
    </div>
  );
}

export function TestAssignmentWorkspace() {
  const { roles } = useAuth();
  const isTeacher = roles.includes("teacher") && !roles.includes("admin");
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTestId = searchParams.get("testId") ?? "";
  const requestedCourseId = searchParams.get("courseId") ?? "";
  const requestedSkill = searchParams.get("skill");
  const [skill, setSkill] = useState<AssignmentSkill>(
    requestedSkill === "LISTENING" || requestedSkill === "WRITING" || requestedSkill === "SPEAKING"
      ? requestedSkill
      : "READING"
  );
  const [step, setStep] = useState<WizardStep>("SELECT");
  const [courses, setCourses] = useState<Course[]>([]);
  const [tests, setTests] = useState<TestBankSummary[]>([]);
  const [assignments, setAssignments] = useState<TestAssignment[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [testQuery, setTestQuery] = useState("");
  const [testTypeFilter, setTestTypeFilter] = useState("ALL");
  const [testSort, setTestSort] = useState("newest");
  const [testPage, setTestPage] = useState(1);
  const [testView, setTestView] = useState<TestView>("GRID");
  const [composer, setComposer] = useState<ComposerState>(createInitialComposer);
  const [deadlinePreset, setDeadlinePreset] = useState<DeadlinePreset>("1_WEEK");
  const [historyQuery, setHistoryQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [assignmentError, setAssignmentError] = useState("");
  const [success, setSuccess] = useState("");

  const eligibleCourses = useMemo(
    () => courses.filter((course) => course.isActive && course.skillPair === coursePairForSkill(skill)),
    [courses, skill]
  );
  const publishedTests = useMemo(
    () => tests.filter((test) => test.skill === skill && test.status === "PUBLISHED" && test.publishedVersion),
    [skill, tests]
  );
  const selectedTests = useMemo(
    () => selectedTestIds
      .map((id) => publishedTests.find((test) => test.id === id))
      .filter((test): test is TestBankSummary => Boolean(test)),
    [publishedTests, selectedTestIds]
  );
  const selectedCourse = eligibleCourses.find((course) => course.id === selectedCourseId) ?? null;
  const selectedSession = sessions.find((session) => session.id === selectedSessionId) ?? null;

  const filteredTests = useMemo(() => {
    const normalized = testQuery.trim().toLocaleLowerCase("vi");
    const result = publishedTests.filter((test) => {
      const matchesQuery = !normalized || `${test.code} ${test.title} ${test.tags.join(" ")}`
        .toLocaleLowerCase("vi")
        .includes(normalized);
      const matchesType = testTypeFilter === "ALL" || test.testType === testTypeFilter;
      return matchesQuery && matchesType;
    });
    return result.sort((left, right) => {
      if (testSort === "title") return left.title.localeCompare(right.title, "vi");
      if (testSort === "questions") return right.totalQuestions - left.totalQuestions;
      if (testSort === "duration") return right.durationMinutes - left.durationMinutes;
      const leftDate = left.publishedVersion?.publishedAt ?? left.updatedAt;
      const rightDate = right.publishedVersion?.publishedAt ?? right.updatedAt;
      return rightDate.localeCompare(leftDate);
    });
  }, [publishedTests, testQuery, testSort, testTypeFilter]);
  const totalTestPages = Math.max(1, Math.ceil(filteredTests.length / TESTS_PER_PAGE));
  const paginatedTests = useMemo(() => {
    const start = (testPage - 1) * TESTS_PER_PAGE;
    return filteredTests.slice(start, start + TESTS_PER_PAGE);
  }, [filteredTests, testPage]);
  const filteredAssignments = useMemo(() => {
    const normalized = historyQuery.trim().toLocaleLowerCase("vi");
    return assignments.filter((item) => {
      if (!showArchived && item.archivedAt) return false;
      return !normalized || `${item.testTitle} ${item.versionLabel} ${item.mode}`
        .toLocaleLowerCase("vi")
        .includes(normalized);
    });
  }, [assignments, historyQuery, showArchived]);

  const loadAssignments = useCallback(async (courseId: string) => {
    if (!courseId) {
      setAssignments([]);
      return;
    }
    setLoadingAssignments(true);
    try {
      setAssignments(await apiFetch<TestAssignment[]>(`/admin/test-assignments?courseId=${encodeURIComponent(courseId)}`));
    } catch (value) {
      setAssignments([]);
      setAssignmentError(value instanceof Error ? value.message : "Không tải được lịch sử giao đề.");
    } finally {
      setLoadingAssignments(false);
    }
  }, []);

  const loadSessions = useCallback(async (courseId: string) => {
    if (!courseId) {
      setSessions([]);
      setSelectedSessionId("");
      return;
    }
    try {
      const values = await apiFetch<ClassSession[]>(`/admin/courses/${courseId}/sessions`);
      setSessions(values);
      setSelectedSessionId((current) =>
        current && values.some((session) => session.id === current) ? current : values[0]?.id ?? ""
      );
    } catch (value) {
      setSessions([]);
      setSelectedSessionId("");
      setAssignmentError(value instanceof Error ? value.message : "Không tải được session của khóa học.");
    }
  }, []);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [courseData, testData] = await Promise.all([
        apiFetch<Page<Course>>(`${isTeacher ? "/admin/courses/assigned" : "/admin/courses"}?active=true&size=100&sort=startsOn,desc`),
        apiFetch<Page<TestBankSummary>>("/admin/test-bank?status=PUBLISHED&size=100"),
      ]);
      setCourses(courseData.content);
      setTests(testData.content);
      const requestedTest = testData.content.find(
        (test) => test.id === requestedTestId && test.status === "PUBLISHED" && test.publishedVersion
      );
      if (requestedTest && requestedTest.skill === skill) setSelectedTestIds([requestedTest.id]);
      const requestedCourse = courseData.content.find(
        (course) => course.id === requestedCourseId && course.isActive && course.skillPair === coursePairForSkill(skill)
      );
      if (requestedCourse) {
        setSelectedCourseId(requestedCourse.id);
        await Promise.all([loadSessions(requestedCourse.id), loadAssignments(requestedCourse.id)]);
      }
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không tải được dữ liệu giao đề.");
    } finally {
      setLoading(false);
    }
  }, [isTeacher, loadAssignments, loadSessions, requestedCourseId, requestedTestId, skill]);

  useEffect(() => {
    void loadWorkspace();
    // Workspace data is loaded once; later course/skill changes reuse this catalog.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setTestPage(1);
  }, [skill, testQuery, testSort, testTypeFilter]);

  useEffect(() => {
    const headingId = {
      SELECT: "select-tests-heading",
      CONFIGURE: "configuration-heading",
      CONFIRM: "confirmation-heading",
    }[step];
    requestAnimationFrame(() => document.getElementById(headingId)?.focus());
  }, [step]);

  function changeSkill(nextSkill: AssignmentSkill) {
    if (nextSkill === skill) return;
    setSkill(nextSkill);
    setStep("SELECT");
    setSelectedTestIds([]);
    setSelectedCourseId("");
    setSelectedSessionId("");
    setSessions([]);
    setAssignments([]);
    setAssignmentError("");
    setSuccess("");
    const params = new URLSearchParams(searchParams);
    params.set("skill", nextSkill);
    params.delete("testId");
    params.delete("courseId");
    setSearchParams(params, { replace: true });
  }

  function toggleTest(testId: string) {
    setAssignmentError("");
    setSuccess("");
    setSelectedTestIds((current) =>
      current.includes(testId) ? current.filter((id) => id !== testId) : [...current, testId]
    );
  }

  function changeCourse(courseId: string) {
    setSelectedCourseId(courseId);
    setSelectedSessionId("");
    setAssignmentError("");
    const params = new URLSearchParams(searchParams);
    courseId ? params.set("courseId", courseId) : params.delete("courseId");
    setSearchParams(params, { replace: true });
    void Promise.all([loadSessions(courseId), loadAssignments(courseId)]);
  }

  function setQuickDeadline(days: 3 | 7 | 14, preset: DeadlinePreset) {
    setDeadlinePreset(preset);
    setComposer((current) => ({ ...current, closesAt: toDateTimeLocal(new Date(Date.now() + DAY_MS * days)) }));
  }

  function validateConfiguration() {
    if (!selectedTestIds.length) return "Chọn ít nhất một đề trước khi thiết lập.";
    if (!selectedCourseId) return "Chọn khóa học hoặc lớp nhận đề.";
    if (!selectedSessionId) return "Chọn session nhận đề.";
    const attempts = Number(composer.maxAttempts);
    if (!Number.isInteger(attempts) || attempts < 1 || attempts > UNLIMITED_ASSIGNMENT_ATTEMPTS) {
      return "Số lượt làm không hợp lệ.";
    }
    if (!composer.closesAt) return "Chọn hạn hoàn thành cho bài giao.";
    if (new Date(composer.closesAt).getTime() <= Date.now()) return "Hạn hoàn thành phải nằm trong tương lai.";
    return "";
  }

  function continueToConfiguration() {
    if (!selectedTestIds.length) {
      setAssignmentError("Chọn ít nhất một đề để tiếp tục.");
      return;
    }
    setAssignmentError("");
    setStep("CONFIGURE");
  }

  function continueToConfirmation() {
    const validation = validateConfiguration();
    if (validation) {
      setAssignmentError(validation);
      return;
    }
    setAssignmentError("");
    setStep("CONFIRM");
  }

  async function submitAssignments() {
    const validation = validateConfiguration();
    if (validation) {
      setAssignmentError(validation);
      setStep("CONFIGURE");
      return;
    }
    setSubmitting(true);
    setAssignmentError("");
    setSuccess("");
    const requests = selectedTests.map((test) => {
      const body: CreateTestAssignmentRequest = {
        testVersionId: test.publishedVersion!.id,
        courseId: selectedCourseId,
        sessionId: selectedSessionId,
        opensAt: null,
        closesAt: dateTimePayload(composer.closesAt),
        maxAttempts: Number(composer.maxAttempts),
        mode: composer.mode,
        durationSeconds: null,
        showResultAfterSubmit: composer.showResultAfterSubmit,
      };
      return apiFetch<TestAssignment>("/admin/test-assignments", { method: "POST", body: JSON.stringify(body) });
    });
    try {
      const results = await Promise.allSettled(requests);
      const created = results
        .filter((result): result is PromiseFulfilledResult<TestAssignment> => result.status === "fulfilled")
        .map((result) => result.value);
      const failedIds = results.flatMap((result, index) =>
        result.status === "rejected" ? [selectedTests[index].id] : []
      );
      if (created.length) setAssignments((current) => [...created, ...current]);
      if (failedIds.length) {
        setSelectedTestIds(failedIds);
        setAssignmentError(`Đã giao ${created.length}/${selectedTests.length} đề. ${failedIds.length} đề chưa giao được; kiểm tra và thử lại.`);
        return;
      }
      setSuccess(`Đã giao ${created.length} đề cho ${selectedCourse?.name ?? "khóa học"}.`);
      setSelectedTestIds([]);
      setStep("SELECT");
      setComposer(createInitialComposer());
      setDeadlinePreset("1_WEEK");
      setTestQuery("");
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
    const confirmed = window.confirm(`Lưu trữ “${item.testTitle}”? Học viên sẽ không thể bắt đầu lượt làm mới từ bài giao này.`);
    if (!confirmed) return;
    setArchivingId(item.id);
    setAssignmentError("");
    try {
      await apiFetch<void>(`/admin/test-assignments/${item.id}`, { method: "DELETE" });
      setAssignments((current) => current.map((value) =>
        value.id === item.id ? { ...value, archivedAt: new Date().toISOString() } : value
      ));
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
      <section className="mx-auto max-w-[1500px] rounded-2xl border border-rose-300 bg-rose-50 p-6" role="alert">
        <div className="flex items-start gap-3">
          <WarningCircle size={24} weight="fill" className="mt-0.5 shrink-0 text-rose-600" />
          <div>
            <h1 className="text-lg font-bold text-rose-950">Không tải được màn hình giao đề</h1>
            <p className="mt-1 text-sm text-rose-800">{error}</p>
            <button type="button" onClick={() => void loadWorkspace()} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-rose-700 px-4 text-sm font-bold text-white">
              <ArrowClockwise size={16} /> Thử lại
            </button>
          </div>
        </div>
      </section>
    );
  }

  const SkillIcon = skillIcon(skill);
  const wizardSteps: Array<{ id: WizardStep; label: string; description: string }> = [
    { id: "SELECT", label: "Chọn đề", description: `${selectedTestIds.length} đề đã chọn` },
    { id: "CONFIGURE", label: "Thiết lập", description: selectedCourse ? selectedCourse.code : "Chưa chọn lớp" },
    { id: "CONFIRM", label: "Xác nhận", description: "Kiểm tra trước khi giao" },
  ];
  const currentStepIndex = wizardSteps.findIndex((item) => item.id === step);
  const canConfirm = Boolean(
    selectedTestIds.length &&
      selectedCourseId &&
      selectedSessionId &&
      composer.closesAt &&
      new Date(composer.closesAt).getTime() > Date.now()
  );

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1500px] space-y-4 pb-12">
      <header className="rounded-2xl border border-outline-variant/40 bg-surface px-4 py-3 shadow-xs sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><PaperPlaneTilt size={21} weight="duotone" /></span>
            <div className="min-w-0"><h1 className="text-xl font-black tracking-tight text-on-surface">Giao đề cho học viên</h1><p className="truncate text-xs text-on-surface-variant">Chọn nhiều đề, thiết lập một lần và kiểm tra trước khi giao.</p></div>
          </div>
          <div className="flex w-full min-w-0 max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-primary/20 bg-primary/5 p-1.5 lg:w-auto" aria-label="Kỹ năng cần giao">
            {(["LISTENING", "READING", "WRITING", "SPEAKING"] as const).map((value) => {
              const Icon = skillIcon(value);
              return (
                <button key={value} type="button" onClick={() => changeSkill(value)} aria-pressed={skill === value} className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-extrabold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${skill === value ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:bg-surface hover:text-primary"}`}>
                  <Icon size={17} weight={skill === value ? "fill" : "duotone"} />
                  {skillLabel(value)}
                </button>
              );
            })}
          </div>
        </div>
        <nav className="mt-3 border-t border-outline-variant/30 pt-3" aria-label="Các bước giao đề">
          <ol className="grid grid-cols-3 gap-2">
            {wizardSteps.map((item, index) => {
              const isActive = item.id === step;
              const isDone = index < currentStepIndex;
              const isAvailable = item.id === "SELECT" || (item.id === "CONFIGURE" ? selectedTestIds.length > 0 : canConfirm);
              return (
                <li key={item.id}>
                  <button type="button" disabled={!isAvailable} onClick={() => setStep(item.id)} aria-current={isActive ? "step" : undefined} className={`flex min-h-14 w-full items-center gap-2 rounded-xl border px-3 text-left transition ${isActive ? "border-primary bg-primary/8 text-primary" : isDone ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-transparent bg-surface-container-low text-on-surface-variant"} disabled:cursor-not-allowed disabled:opacity-50`}>
                    <span className={`grid size-7 shrink-0 place-items-center rounded-lg text-xs font-black ${isActive ? "bg-primary text-on-primary" : isDone ? "bg-emerald-600 text-white" : "bg-surface text-on-surface-variant"}`}>{isDone ? <Check size={14} weight="bold" /> : index + 1}</span>
                    <span className="min-w-0"><strong className="block text-sm">{item.label}</strong><small className="hidden truncate text-[11px] font-medium opacity-75 sm:block">{item.description}</small></span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </header>

      {(success || assignmentError) && (
        <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${assignmentError ? "border-rose-300 bg-rose-50 text-rose-900" : "border-emerald-300 bg-emerald-50 text-emerald-900"}`} role={assignmentError ? "alert" : "status"} aria-live="polite">
          {assignmentError ? <WarningCircle size={18} weight="fill" className="mt-0.5 shrink-0" /> : <CheckCircle size={18} weight="fill" className="mt-0.5 shrink-0" />}<span className="font-semibold">{assignmentError || success}</span>
        </div>
      )}

      {step === "SELECT" && (
        <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]" aria-labelledby="select-tests-heading">
          <div className="min-w-0 overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface shadow-xs">
            <div className="flex min-w-0 items-center gap-2 overflow-x-auto whitespace-nowrap border-b border-outline-variant/30 bg-surface-container-low/35 p-3 sm:p-4">
              <div className="flex min-w-[210px] shrink-0 items-center gap-2"><SkillIcon size={19} weight="duotone" className="shrink-0 text-primary" /><h2 id="select-tests-heading" tabIndex={-1} className="truncate text-base font-extrabold text-on-surface outline-none">Đề {skillLabel(skill)} đã xuất bản</h2></div>
              <label className="relative min-w-[220px] flex-1"><span className="sr-only">Tìm đề</span><MagnifyingGlass size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" /><input value={testQuery} onChange={(event) => setTestQuery(event.target.value)} placeholder="Tìm mã đề hoặc tên đề" className="min-h-10 w-full rounded-lg border-outline-variant/60 bg-surface pl-9 text-sm" /></label>
              <label className="w-40 shrink-0"><span className="sr-only">Loại đề</span><select value={testTypeFilter} onChange={(event) => setTestTypeFilter(event.target.value)} className="min-h-10 w-full rounded-lg border-outline-variant/60 bg-surface text-sm"><option value="ALL">Tất cả loại đề</option><option value="FULL_TEST">Full đề</option><option value="SINGLE_SKILL">Bài kỹ năng</option></select></label>
              <label className="w-36 shrink-0"><span className="sr-only">Sắp xếp</span><select value={testSort} onChange={(event) => setTestSort(event.target.value)} className="min-h-10 w-full rounded-lg border-outline-variant/60 bg-surface text-sm"><option value="newest">Mới xuất bản</option><option value="title">Tên A đến Z</option><option value="questions">Nhiều câu nhất</option><option value="duration">Thời lượng dài nhất</option></select></label>
              <span className="shrink-0 text-xs font-bold tabular-nums text-on-surface-variant">{filteredTests.length} đề</span>
              <div className="flex shrink-0 rounded-lg border border-outline-variant/40 bg-surface p-1" aria-label="Kiểu hiển thị đề">
                <button type="button" title="Hiển thị dạng lưới" aria-label="Hiển thị dạng lưới" aria-pressed={testView === "GRID"} onClick={() => setTestView("GRID")} className={`grid size-8 place-items-center rounded-md transition ${testView === "GRID" ? "bg-primary/10 text-primary" : "text-on-surface-variant hover:text-on-surface"}`}><SquaresFour size={16} weight={testView === "GRID" ? "fill" : "regular"} /></button>
                <button type="button" title="Hiển thị dạng danh sách" aria-label="Hiển thị dạng danh sách" aria-pressed={testView === "LIST"} onClick={() => setTestView("LIST")} className={`grid size-8 place-items-center rounded-md transition ${testView === "LIST" ? "bg-primary/10 text-primary" : "text-on-surface-variant hover:text-on-surface"}`}><Rows size={16} weight={testView === "LIST" ? "bold" : "regular"} /></button>
              </div>
            </div>
            {testView === "GRID" ? (
              <div className="grid gap-2.5 p-2.5 sm:grid-cols-3 lg:grid-cols-5">
                {paginatedTests.map((test) => {
                  const selected = selectedTestIds.includes(test.id);
                  return (
                    <button
                      key={test.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleTest(test.id)}
                      className={`group relative flex h-full min-w-0 flex-col overflow-hidden rounded-xl border text-left transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                        selected
                          ? "border-primary bg-primary/6 ring-1 ring-primary/20 shadow-xs"
                          : "border-outline-variant/45 bg-surface hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-md"
                      }`}
                    >
                      <span className="relative block h-28 w-full shrink-0 overflow-hidden border-b border-outline-variant/20 bg-surface-container-low">
                        <TestArtwork test={test} className="h-full w-full" />
                        <span
                          className={`absolute right-2 top-2 z-10 grid size-6 place-items-center rounded-md border shadow-xs transition-colors ${
                            selected
                              ? "border-primary bg-primary text-on-primary"
                              : "border-slate-300 bg-white/90 text-transparent hover:border-primary"
                          }`}
                        >
                          <Check size={13} weight="bold" />
                        </span>
                      </span>
                      <span className="flex flex-1 flex-col justify-between p-2.5">
                        <span className="block">
                          <span className="flex items-center justify-between gap-1 text-[10px] font-bold">
                            <span className="truncate font-mono text-primary">{test.code}</span>
                            <span className="shrink-0 font-mono text-on-surface-variant">
                              {test.publishedVersion?.versionLabel ?? test.version}
                            </span>
                          </span>
                          <strong className="mt-1 line-clamp-2 min-h-8 text-xs leading-4 text-on-surface group-hover:text-primary transition-colors">
                            {test.title}
                          </strong>
                        </span>
                        <span className="mt-2 flex items-center justify-between gap-1 border-t border-outline-variant/25 pt-2 text-[10px] font-semibold text-on-surface-variant">
                          <span className="truncate">{formatLabelOf(test)}</span>
                          <span className="flex shrink-0 items-center gap-1 tabular-nums">
                            <span>{test.totalQuestions} câu</span>
                            <span className="inline-flex items-center gap-0.5">
                              <Timer size={11} />
                              {test.durationMinutes}p
                            </span>
                          </span>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] border-collapse text-left text-sm">
                  <thead className="bg-surface-container-low text-xs font-bold text-on-surface-variant"><tr><th className="w-14 px-4 py-3"><span className="sr-only">Chọn</span></th><th className="px-3 py-3">Đề</th><th className="px-3 py-3">Mã đề</th><th className="px-3 py-3">Phiên bản</th><th className="px-3 py-3">Cấu trúc</th><th className="px-3 py-3 text-right">Số câu</th><th className="px-3 py-3 text-right">Thời lượng</th><th className="px-4 py-3 text-right">Xuất bản</th></tr></thead>
                  <tbody className="divide-y divide-outline-variant/25">
                    {paginatedTests.map((test) => {
                      const selected = selectedTestIds.includes(test.id);
                      return (
                        <tr key={test.id} className={`transition ${selected ? "bg-primary/6" : "hover:bg-surface-container-low/60"}`}>
                          <td className="px-2 py-1"><label className="grid size-11 cursor-pointer place-items-center"><input type="checkbox" checked={selected} onChange={() => toggleTest(test.id)} aria-label={`Chọn đề ${test.title}`} className="size-4 rounded border-outline-variant text-primary focus:ring-primary" /></label></td>
                          <td className="max-w-sm px-3 py-2"><button type="button" onClick={() => toggleTest(test.id)} className="grid min-h-14 w-full grid-cols-[72px_minmax(0,1fr)] items-center gap-3 text-left"><TestArtwork test={test} className="h-12 w-[72px] rounded-lg" /><span className="min-w-0"><strong className="line-clamp-2 font-bold text-on-surface">{test.title}</strong><span className="mt-1 block text-xs text-on-surface-variant">{test.tags.slice(0, 2).join(" · ") || skillLabel(skill)}</span></span></button></td>
                          <td className="px-3 py-3 font-mono text-xs font-bold text-primary">{test.code}</td><td className="px-3 py-3 font-semibold text-on-surface">{test.publishedVersion?.versionLabel ?? test.version}</td><td className="px-3 py-3 text-on-surface-variant">{formatLabelOf(test)}</td><td className="px-3 py-3 text-right font-bold tabular-nums text-on-surface">{test.totalQuestions}</td><td className="px-3 py-3 text-right font-bold tabular-nums text-on-surface">{test.durationMinutes} phút</td><td className="px-4 py-3 text-right text-xs text-on-surface-variant">{dateLabel(test.publishedVersion?.publishedAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {!paginatedTests.length && <div className="grid min-h-64 place-items-center px-6 text-center"><div><BookOpenText size={32} className="mx-auto text-primary/50" /><h3 className="mt-3 font-bold text-on-surface">Không tìm thấy đề phù hợp</h3><p className="mt-1 text-sm text-on-surface-variant">Đổi từ khóa hoặc bộ lọc để thử lại.</p></div></div>}
            {totalTestPages > 1 && <footer className="flex items-center justify-between border-t border-outline-variant/30 px-4 py-3 text-xs text-on-surface-variant"><span>Trang {testPage}/{totalTestPages}</span><div className="flex gap-2"><button type="button" aria-label="Trang trước" disabled={testPage === 1} onClick={() => setTestPage((page) => Math.max(1, page - 1))} className="grid size-11 place-items-center rounded-lg border border-outline-variant/50 disabled:opacity-40"><CaretLeft size={15} /></button><button type="button" aria-label="Trang sau" disabled={testPage === totalTestPages} onClick={() => setTestPage((page) => Math.min(totalTestPages, page + 1))} className="grid size-11 place-items-center rounded-lg border border-outline-variant/50 disabled:opacity-40"><CaretRight size={15} /></button></div></footer>}
          </div>
          <aside className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface shadow-xs xl:sticky xl:top-4">
            <div className="border-b border-outline-variant/30 px-4 py-3"><div className="flex items-center justify-between"><h2 className="font-extrabold text-on-surface">Đã chọn</h2><span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-black tabular-nums text-primary">{selectedTests.length}</span></div><p className="mt-1 text-xs text-on-surface-variant">Các đề sẽ dùng chung cấu hình giao bài.</p></div>
            <div className="max-h-[390px] overflow-y-auto p-2">
              {selectedTests.length ? selectedTests.map((test) => <article key={test.id} className="flex items-center gap-3 border-b border-outline-variant/25 px-2 py-3 last:border-0"><TestArtwork test={test} className="h-11 w-14 shrink-0 rounded-lg" /><div className="min-w-0 flex-1"><strong className="line-clamp-2 text-sm text-on-surface">{test.title}</strong><span className="mt-1 block text-xs text-on-surface-variant">{test.code} · {test.publishedVersion?.versionLabel}</span></div><button type="button" onClick={() => toggleTest(test.id)} aria-label={`Bỏ chọn ${test.title}`} className="grid size-11 shrink-0 place-items-center rounded-lg text-on-surface-variant hover:bg-rose-50 hover:text-rose-700"><X size={15} /></button></article>) : <div className="grid min-h-48 place-items-center px-4 text-center"><div><CheckCircle size={30} className="mx-auto text-outline-variant" /><p className="mt-3 text-sm font-bold text-on-surface">Chưa chọn đề</p><p className="mt-1 text-xs leading-5 text-on-surface-variant">Đánh dấu nhiều đề trong bảng để giao cùng lúc.</p></div></div>}
            </div>
            <footer className="border-t border-outline-variant/30 bg-surface-container-low/45 p-3"><button type="button" disabled={!selectedTests.length} onClick={continueToConfiguration} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-extrabold text-on-primary transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50">Thiết lập {selectedTests.length} đề<CaretRight size={16} weight="bold" /></button></footer>
          </aside>
        </section>
      )}

      {step === "CONFIGURE" && (
        <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]" aria-labelledby="configuration-heading">
          <div className="min-w-0 rounded-2xl border border-outline-variant/40 bg-surface p-4 shadow-xs">
            <div className="flex flex-col gap-2 border-b border-outline-variant/30 pb-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 id="configuration-heading" tabIndex={-1} className="text-base font-extrabold text-on-surface outline-none">Thiết lập bài giao</h2><p className="mt-0.5 text-xs text-on-surface-variant">Một cấu hình áp dụng cho toàn bộ {selectedTests.length} đề.</p></div><span className="inline-flex items-center gap-1.5 self-start rounded-lg bg-primary/8 px-2.5 py-1.5 text-xs font-bold text-primary"><Exam size={15} weight="duotone" />{skillLabel(skill)} · {selectedTests.length} đề</span></div>
            <div className="mt-3 grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
              <section className="min-w-0 rounded-xl border border-outline-variant/40 bg-surface-container-low/35 p-3">
                <label className="min-w-0 text-xs font-bold text-on-surface"><span className="flex items-center gap-2"><Buildings size={17} weight="duotone" className="text-primary" />Khóa học / lớp <span className="text-rose-600">*</span></span><select value={selectedCourseId} onChange={(event) => changeCourse(event.target.value)} className="mt-2 min-h-11 w-full min-w-0 max-w-full rounded-lg border-outline-variant/60 bg-surface text-sm"><option value="">Chọn khóa học</option>{eligibleCourses.map((course) => <option key={course.id} value={course.id}>{course.code} · {course.name}</option>)}</select><span className="mt-1 block font-medium text-on-surface-variant">Khóa phù hợp với {skillLabel(skill)}.</span></label>
              </section>
              <section className="min-w-0 rounded-xl border border-outline-variant/40 bg-surface-container-low/35 p-3">
                <label className="min-w-0 text-xs font-bold text-on-surface"><span className="flex items-center gap-2"><CalendarBlank size={17} weight="duotone" className="text-primary" />Session <span className="text-rose-600">*</span></span><select value={selectedSessionId} disabled={!selectedCourseId} onChange={(event) => setSelectedSessionId(event.target.value)} className="mt-2 min-h-11 w-full min-w-0 max-w-full rounded-lg border-outline-variant/60 bg-surface text-sm disabled:opacity-50"><option value="">Chọn session</option>{sessions.map((session) => <option key={session.id} value={session.id}>Session {session.sessionNo} · {session.title || "Chưa đặt tên"}</option>)}</select><span className="mt-1 block font-medium text-on-surface-variant">Vị trí hiển thị trong tiến độ.</span></label>
              </section>
              <section className="min-w-0 rounded-xl border border-outline-variant/40 bg-surface-container-low/35 p-3">
                <label className="text-xs font-bold text-on-surface"><span className="flex items-center gap-2"><ArrowClockwise size={17} weight="duotone" className="text-primary" />Số lượt làm</span><select value={composer.maxAttempts} onChange={(event) => setComposer((current) => ({ ...current, maxAttempts: event.target.value }))} className="mt-2 min-h-11 w-full rounded-lg border-outline-variant/60 bg-surface text-sm"><option value={UNLIMITED_ASSIGNMENT_ATTEMPTS}>Không giới hạn</option>{[1, 2, 3, 5, 10].map((attempts) => <option key={attempts} value={attempts}>{attempts} lượt</option>)}</select></label>
              </section>

              <fieldset className="min-w-0 rounded-xl border border-outline-variant/40 p-3"><legend className="sr-only">Hình thức làm bài</legend><div className="flex items-center gap-2 text-xs font-bold text-on-surface"><Exam size={17} weight="duotone" className="text-primary" />Hình thức làm bài</div><div className="mt-2 grid grid-cols-2 gap-2">{(["PRACTICE", "EXAM"] as const).map((mode) => <button key={mode} type="button" aria-pressed={composer.mode === mode} onClick={() => setComposer((current) => ({ ...current, mode }))} className={`min-h-14 rounded-lg border px-3 text-left transition ${composer.mode === mode ? "border-primary bg-primary/7 ring-1 ring-primary/20" : "border-outline-variant/50 hover:bg-surface-container-low"}`}><strong className="block text-sm text-on-surface">{mode === "PRACTICE" ? "Luyện tập" : "Thi thử"}</strong><span className="mt-0.5 block text-[11px] leading-4 text-on-surface-variant">{mode === "PRACTICE" ? "Linh hoạt, học từ lỗi sai" : "Mô phỏng điều kiện thi"}</span></button>)}</div></fieldset>

              <fieldset className="min-w-0 rounded-xl border border-outline-variant/40 p-3"><legend className="sr-only">Hạn hoàn thành</legend><div className="flex items-center gap-2 text-xs font-bold text-on-surface"><Clock size={17} weight="duotone" className="text-primary" />Hạn hoàn thành <span className="text-rose-600">*</span></div><div className="mt-2 flex gap-1.5" aria-label="Chọn hạn nhanh">{([{ id: "3_DAYS", label: "3 ngày", days: 3 }, { id: "1_WEEK", label: "1 tuần", days: 7 }, { id: "2_WEEKS", label: "2 tuần", days: 14 }] as const).map((preset) => <button key={preset.id} type="button" aria-pressed={deadlinePreset === preset.id} onClick={() => setQuickDeadline(preset.days, preset.id)} className={`min-h-9 flex-1 rounded-lg border px-2 text-xs font-bold ${deadlinePreset === preset.id ? "border-primary bg-primary/8 text-primary" : "border-outline-variant/50 text-on-surface-variant hover:bg-surface-container-low"}`}>{preset.label}</button>)}</div><label className="mt-2 block"><span className="sr-only">Ngày và giờ cụ thể</span><input type="datetime-local" value={composer.closesAt} min={toDateTimeLocal(new Date())} onChange={(event) => { setDeadlinePreset("CUSTOM"); setComposer((current) => ({ ...current, closesAt: event.target.value })); }} className="min-h-11 w-full rounded-lg border-outline-variant/60 bg-surface text-sm" /></label></fieldset>

              <label className={`flex min-w-0 cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${composer.showResultAfterSubmit ? "border-primary bg-primary/7" : "border-outline-variant/40 hover:bg-surface-container-low"}`}><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface text-primary shadow-sm">{composer.showResultAfterSubmit ? <Eye size={18} weight="duotone" /> : <EyeSlash size={18} />}</span><span className="min-w-0 flex-1"><strong className="block text-sm text-on-surface">Xem kết quả sau nộp</strong><small className="mt-1 block text-[11px] leading-4 text-on-surface-variant">Điểm, đúng sai và giải thích.</small></span><input type="checkbox" checked={composer.showResultAfterSubmit} onChange={(event) => setComposer((current) => ({ ...current, showResultAfterSubmit: event.target.checked }))} className="size-4 shrink-0 rounded border-outline-variant text-primary focus:ring-primary" /></label>

              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2.5 md:col-span-2 xl:col-span-3"><CheckCircle size={19} weight="duotone" className="mt-0.5 shrink-0 text-emerald-700" /><div><strong className="text-xs text-emerald-950">Cách hoàn thành</strong><p className="mt-0.5 text-xs leading-5 text-emerald-900/80">Làm đề trực tiếp trên hệ thống hoặc nộp ảnh minh chứng nếu đã làm trên web khác hay trên giấy.</p></div></div>
            </div>
            <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/30 pt-4"><button type="button" onClick={() => setStep("SELECT")} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-outline-variant/60 px-4 text-sm font-bold text-on-surface"><CaretLeft size={16} />Quay lại chọn đề</button><button type="button" onClick={continueToConfirmation} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-extrabold text-on-primary">Kiểm tra trước khi giao<CaretRight size={16} /></button></footer>
          </div>
          <aside className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface shadow-xs xl:sticky xl:top-4"><div className="border-b border-outline-variant/30 px-4 py-3"><h2 className="font-extrabold text-on-surface">Tóm tắt lựa chọn</h2><p className="mt-1 text-xs text-on-surface-variant">{selectedTests.length} đề {skillLabel(skill)}</p></div><div className="divide-y divide-outline-variant/25 p-2">{selectedTests.map((test) => <div key={test.id} className="flex items-center gap-3 px-2 py-2.5"><TestArtwork test={test} className="h-11 w-14 shrink-0 rounded-lg" /><div className="min-w-0"><strong className="line-clamp-2 text-xs text-on-surface">{test.title}</strong><span className="mt-1 block text-[11px] text-on-surface-variant">{test.code} · {test.totalQuestions} câu</span></div></div>)}</div></aside>
        </section>
      )}

      {step === "CONFIRM" && (
        <section className="rounded-2xl border border-outline-variant/40 bg-surface shadow-xs" aria-label="Xác nhận bài giao">
          <div className="grid min-w-0 xl:grid-cols-2">
            <section className="min-w-0 p-4 sm:p-5" aria-label="Các đề sẽ giao">
              <div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-extrabold text-on-surface">{selectedTests.length} đề sẽ giao</h3><p className="mt-0.5 text-xs text-on-surface-variant">Ảnh và phiên bản đề được cố định theo lần giao này.</p></div><button type="button" onClick={() => setStep("SELECT")} className="min-h-11 rounded-lg px-3 text-xs font-bold text-primary hover:bg-primary/8">Chỉnh sửa</button></div>
              <div className="mt-3 space-y-3">
                {selectedTests.map((test) => (
                  <article key={test.id} className="flex min-w-0 overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-low/25">
                    <TestArtwork test={test} className="h-28 w-28 shrink-0" />
                    <div className="min-w-0 flex-1 p-3"><span className="font-mono text-[11px] font-bold text-primary">{test.code}</span><h4 className="mt-1 line-clamp-2 text-sm font-extrabold leading-5 text-on-surface">{test.title}</h4><div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-semibold text-on-surface-variant"><span className="inline-flex items-center gap-1"><Exam size={13} />{formatLabelOf(test)}</span><span>{test.publishedVersion?.versionLabel}</span><span>{test.totalQuestions} câu</span><span className="inline-flex items-center gap-1"><Timer size={13} />{test.durationMinutes} phút</span></div></div>
                  </article>
                ))}
              </div>
            </section>

            <aside className="border-t border-outline-variant/30 bg-surface-container-low/35 p-4 sm:p-5 xl:border-l xl:border-t-0" aria-label="Thông tin giao bài">
              <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-extrabold text-on-surface">Lớp và cấu hình</h3><button type="button" onClick={() => setStep("CONFIGURE")} className="min-h-11 rounded-lg px-3 text-xs font-bold text-primary hover:bg-primary/8">Chỉnh sửa</button></div>
              {selectedCourse && <article className="mt-3 flex overflow-hidden rounded-xl border border-outline-variant/40 bg-surface"><CourseArtwork course={selectedCourse} className="h-28 w-28 shrink-0" /><div className="min-w-0 flex-1 p-3"><span className="text-[11px] font-extrabold uppercase tracking-[.12em] text-primary">{selectedCourse.code}</span><h4 className="mt-1 line-clamp-2 text-sm font-extrabold text-on-surface">{selectedCourse.name}</h4><p className="mt-2 flex items-center gap-1.5 text-xs text-on-surface-variant"><CalendarBlank size={14} />Session {selectedSession?.sessionNo} · {selectedSession?.title || "Chưa đặt tên"}</p></div></article>}
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl border border-outline-variant/35 bg-surface p-3"><dt className="flex items-center gap-2 text-[11px] font-semibold text-on-surface-variant"><Exam size={16} weight="duotone" className="text-primary" />Hình thức</dt><dd className="mt-1.5 font-extrabold text-on-surface">{composer.mode === "PRACTICE" ? "Luyện tập" : "Thi thử"}</dd></div>
                <div className="rounded-xl border border-outline-variant/35 bg-surface p-3"><dt className="flex items-center gap-2 text-[11px] font-semibold text-on-surface-variant"><ArrowClockwise size={16} weight="duotone" className="text-primary" />Số lượt</dt><dd className="mt-1.5 font-extrabold text-on-surface">{hasUnlimitedAssignmentAttempts(Number(composer.maxAttempts)) ? "Không giới hạn" : `${composer.maxAttempts} lượt`}</dd></div>
                <div className="rounded-xl border border-outline-variant/35 bg-surface p-3"><dt className="flex items-center gap-2 text-[11px] font-semibold text-on-surface-variant"><Clock size={16} weight="duotone" className="text-primary" />Hạn hoàn thành</dt><dd className="mt-1.5 font-extrabold leading-5 text-on-surface">{dateTimeLabel(dateTimePayload(composer.closesAt))}</dd></div>
                <div className="rounded-xl border border-outline-variant/35 bg-surface p-3"><dt className="flex items-center gap-2 text-[11px] font-semibold text-on-surface-variant"><Eye size={16} weight="duotone" className="text-primary" />Xem kết quả</dt><dd className="mt-1.5 font-extrabold text-on-surface">{composer.showResultAfterSubmit ? "Ngay sau khi nộp" : "Không"}</dd></div>
                <div className="col-span-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3"><dt className="flex items-center gap-2 text-[11px] font-semibold text-emerald-800"><CheckCircle size={16} weight="duotone" />Cách hoàn thành</dt><dd className="mt-1.5 text-xs font-bold leading-5 text-emerald-950">Làm đề trên hệ thống hoặc nộp ảnh minh chứng thay thế.</dd></div>
              </dl>
            </aside>
          </div>
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/30 px-4 py-3 sm:px-5"><button type="button" onClick={() => setStep("CONFIGURE")} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-outline-variant/60 px-4 text-sm font-bold text-on-surface"><CaretLeft size={16} />Quay lại thiết lập</button><button type="button" disabled={submitting} onClick={() => void submitAssignments()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-extrabold text-on-primary transition hover:brightness-95 disabled:cursor-wait disabled:opacity-60">{submitting ? <SpinnerGap size={17} className="animate-spin" /> : <PaperPlaneTilt size={17} weight="bold" />}{submitting ? "Đang giao..." : `Giao ${selectedTests.length} đề`}</button></footer>
        </section>
      )}

      <section className="rounded-2xl border border-outline-variant/40 bg-surface shadow-xs" aria-labelledby="history-heading">
        <div className="flex flex-col gap-3 border-b border-outline-variant/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div><h2 id="history-heading" className="text-base font-extrabold text-on-surface">Bài đã giao</h2><p className="mt-0.5 text-xs text-on-surface-variant">{selectedCourse ? `${selectedCourse.code} · ${selectedCourse.name}` : "Chọn khóa học ở bước Thiết lập để xem lịch sử."}</p></div><div className="flex flex-wrap items-center gap-2"><label className="relative min-w-52 flex-1"><span className="sr-only">Tìm bài đã giao</span><MagnifyingGlass size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" /><input value={historyQuery} onChange={(event) => setHistoryQuery(event.target.value)} placeholder="Tìm bài đã giao" className="min-h-11 w-full rounded-lg border-outline-variant/60 bg-surface pl-9 text-sm" /></label><label className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-outline-variant/50 px-3 text-xs font-bold"><input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} className="rounded border-outline-variant text-primary focus:ring-primary" />Đã lưu trữ</label></div></div>
        {loadingAssignments ? <div className="grid min-h-40 place-items-center" role="status"><span className="flex items-center gap-2 text-sm font-bold text-on-surface-variant"><SpinnerGap size={18} className="animate-spin" />Đang tải lịch sử</span></div> : !selectedCourseId ? <div className="grid min-h-40 place-items-center px-6 text-center"><div><Student size={30} className="mx-auto text-primary/50" /><p className="mt-2 text-sm font-bold text-on-surface">Chưa chọn khóa học</p><p className="mt-1 text-xs text-on-surface-variant">Lịch sử sẽ hiển thị sau khi chọn nơi nhận bài.</p></div></div> : !filteredAssignments.length ? <div className="grid min-h-40 place-items-center px-6 text-center"><div><CalendarBlank size={30} className="mx-auto text-primary/50" /><p className="mt-2 text-sm font-bold text-on-surface">Chưa có bài giao phù hợp</p><p className="mt-1 text-xs text-on-surface-variant">Các đề vừa giao sẽ xuất hiện tại đây.</p></div></div> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs"><thead className="bg-surface-container-low text-on-surface-variant"><tr><th className="px-4 py-3">Đề đã giao</th><th className="px-3 py-3">Session</th><th className="px-3 py-3">Hình thức</th><th className="px-3 py-3">Hạn hoàn thành</th><th className="px-3 py-3">Cấu hình</th><th className="px-3 py-3">Trạng thái</th><th className="px-4 py-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-outline-variant/25">{filteredAssignments.map((item) => <tr key={item.id} className="hover:bg-surface-container-low/50"><td className="px-4 py-3"><strong className="block max-w-xs truncate text-sm text-on-surface">{item.testTitle}</strong><span className="text-primary">{item.versionLabel}</span></td><td className="px-3 py-3 text-on-surface-variant">{item.sessionNo ? `Session ${item.sessionNo}` : "—"}</td><td className="px-3 py-3 font-bold text-on-surface">{item.mode === "EXAM" ? "Thi thử" : "Luyện tập"}</td><td className="px-3 py-3 text-on-surface-variant">{dateTimeLabel(item.closesAt)}</td><td className="px-3 py-3 text-on-surface-variant">{hasUnlimitedAssignmentAttempts(item.maxAttempts) ? "Không giới hạn" : `${item.maxAttempts} lượt`}</td><td className="px-3 py-3"><StatusBadge assignment={item} /></td><td className="px-4 py-3 text-right">{!item.archivedAt && <button type="button" disabled={archivingId === item.id} onClick={() => void archiveAssignment(item)} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 font-bold text-rose-700 disabled:opacity-50">{archivingId === item.id ? <SpinnerGap size={14} className="animate-spin" /> : <Archive size={14} />}Lưu trữ</button>}</td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
}
