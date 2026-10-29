import {
  Archive,
  ArrowClockwise,
  BookOpenText,
  CalendarBlank,
  Cards,
  CaretDown,
  CaretLeft,
  CaretRight,
  Check,
  CheckCircle,
  Clock,
  Eye,
  EyeSlash,
  GraduationCap,
  Headphones,
  Image as ImageIcon,
  MagnifyingGlass,
  Microphone,
  PaperPlaneTilt,
  PencilSimpleLine,
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
import { useAuth } from "../../auth/AuthContext";
import type { ClassSession, Course, Page } from "../../academic-types";
import type { TestBankSummary } from "../../library-types";
import { apiFetch } from "../../lib/api";
import AuthenticatedMediaImage from "../test-builder/AuthenticatedMediaImage";

type ComposerState = {
  mode: ReadingAssignmentMode;
  opensAt: string;
  closesAt: string;
  maxAttempts: string;
  durationMinutes: string;
  showResultAfterSubmit: boolean;
};

type AssignmentSkill = "LISTENING" | "READING" | "WRITING" | "SPEAKING";

const initialComposer: ComposerState = {
  mode: "PRACTICE",
  opensAt: "",
  closesAt: "",
  maxAttempts: "1",
  durationMinutes: "60",
  showResultAfterSubmit: true,
};

const formatLabels: Record<string, string> = {
  ALL: "Tất cả cấu trúc",
  SINGLE: "Bài lẻ",
  FULL: "Full đề (Full Test)",
  DICTATION: "Dictation",
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

function formatLabelOf(test: TestBankSummary): string {
  const rawFormat = (test.format || "").toUpperCase();
  if (formatLabels[rawFormat]) return formatLabels[rawFormat];
  const tagFormat = test.tags?.find((tag) => formatLabels[tag.toUpperCase()]);
  if (tagFormat) return formatLabels[tagFormat.toUpperCase()];
  if (test.testType === "FULL_TEST" || (test.sectionsCount && test.sectionsCount > 1)) {
    return "Full đề (Full Test)";
  }
  return "Bài lẻ";
}

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

function shortDateLabel(value: string | null | undefined) {
  if (!value) return "Chưa xác định";
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

function coursePairForSkill(skill: AssignmentSkill) {
  return ["READING", "LISTENING"].includes(skill)
    ? "LISTENING_READING"
    : "SPEAKING_WRITING";
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
    muted: "border-slate-200 bg-slate-50 text-slate-400",
  }[status.tone];

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-bold ${classes}`}
    >
      {status.label}
    </span>
  );
}

function WorkspaceSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Đang tải màn hình giao đề">
      <div className="h-16 animate-pulse rounded-2xl bg-surface-container" />
      <div className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-8 space-y-4">
          <div className="h-48 animate-pulse rounded-2xl bg-surface-container" />
          <div className="h-80 animate-pulse rounded-2xl bg-surface-container" />
        </div>
        <div className="xl:col-span-4 h-[500px] animate-pulse rounded-2xl bg-surface-container" />
      </div>
    </div>
  );
}

export function TestAssignmentWorkspace() {
  const { roles } = useAuth();
  const isTeacher = roles.includes("teacher") && !roles.includes("admin");
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTestId = searchParams.get("testId") ?? "";
  const requestedSkill = searchParams.get("skill");
  const [skill, setSkill] = useState<AssignmentSkill>(
    requestedSkill === "LISTENING" ||
      requestedSkill === "WRITING" ||
      requestedSkill === "SPEAKING"
      ? requestedSkill
      : "READING"
  );
  const [courses, setCourses] = useState<Course[]>([]);
  const [tests, setTests] = useState<TestBankSummary[]>([]);
  const [assignments, setAssignments] = useState<TestAssignment[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState(
    searchParams.get("courseId") ?? ""
  );
  const [courseQuery, setCourseQuery] = useState("");
  const [coursePage, setCoursePage] = useState(1);
  const COURSES_PER_PAGE = 4;

  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [selectedTestId, setSelectedTestId] = useState(requestedTestId);
  const [testQuery, setTestQuery] = useState("");
  const [testTypeFilter, setTestTypeFilter] = useState<string>("ALL");
  const [testSort, setTestSort] = useState<string>("newest");
  const [testPage, setTestPage] = useState(1);
  const TESTS_PER_PAGE = 6;

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
    () =>
      courses.filter(
        (course) =>
          course.isActive && course.skillPair === coursePairForSkill(skill)
      ),
    [courses, skill]
  );

  const publishedTests = useMemo(
    () =>
      tests.filter(
        (test) =>
          test.skill === skill &&
          test.status === "PUBLISHED" &&
          test.publishedVersion
      ),
    [skill, tests]
  );

  const selectedCourse =
    eligibleCourses.find((course) => course.id === selectedCourseId) ?? null;
  const selectedTest =
    publishedTests.find((test) => test.id === selectedTestId) ?? null;

  const filteredCourses = useMemo(() => {
    const normalized = courseQuery.trim().toLocaleLowerCase("vi");
    if (!normalized) return eligibleCourses;
    return eligibleCourses.filter((course) =>
      `${course.code} ${course.name} ${course.level ?? ""}`
        .toLocaleLowerCase("vi")
        .includes(normalized)
    );
  }, [courseQuery, eligibleCourses]);

  // Paginated Courses (4 per page)
  const totalCoursePages = Math.max(1, Math.ceil(filteredCourses.length / COURSES_PER_PAGE));
  const paginatedCourses = useMemo(() => {
    const start = (coursePage - 1) * COURSES_PER_PAGE;
    return filteredCourses.slice(start, start + COURSES_PER_PAGE);
  }, [coursePage, filteredCourses]);

  useEffect(() => {
    setCoursePage(1);
  }, [courseQuery, skill]);

  const filteredTests = useMemo(() => {
    let result = publishedTests;

    // Filter by search query
    const normalized = testQuery.trim().toLocaleLowerCase("vi");
    if (normalized) {
      result = result.filter((test) =>
        `${test.code} ${test.title} ${test.tags?.join(" ") ?? ""}`
          .toLocaleLowerCase("vi")
          .includes(normalized)
      );
    }

    // Filter by test type
    if (testTypeFilter !== "ALL") {
      result = result.filter((test) => test.testType === testTypeFilter);
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (testSort === "duration_asc") {
        return (a.durationMinutes || 0) - (b.durationMinutes || 0);
      }
      if (testSort === "duration_desc") {
        return (b.durationMinutes || 0) - (a.durationMinutes || 0);
      }
      if (testSort === "questions") {
        return (b.totalQuestions || 0) - (a.totalQuestions || 0);
      }
      // default "newest"
      const dateA = a.publishedVersion?.publishedAt ? new Date(a.publishedVersion.publishedAt).getTime() : 0;
      const dateB = b.publishedVersion?.publishedAt ? new Date(b.publishedVersion.publishedAt).getTime() : 0;
      return dateB - dateA;
    });

    return result;
  }, [publishedTests, testQuery, testSort, testTypeFilter]);

  // Paginated Tests (6 per page)
  const totalTestPages = Math.max(1, Math.ceil(filteredTests.length / TESTS_PER_PAGE));
  const paginatedTests = useMemo(() => {
    const start = (testPage - 1) * TESTS_PER_PAGE;
    return filteredTests.slice(start, start + TESTS_PER_PAGE);
  }, [filteredTests, testPage]);

  useEffect(() => {
    setTestPage(1);
  }, [testQuery, testTypeFilter, testSort, skill]);

  const filteredAssignments = useMemo(() => {
    const normalized = historyQuery.trim().toLocaleLowerCase("vi");
    return assignments.filter((item) => {
      if (!showArchived && item.archivedAt) return false;
      return (
        !normalized ||
        `${item.testTitle} ${item.versionLabel} ${item.mode}`
          .toLocaleLowerCase("vi")
          .includes(normalized)
      );
    });
  }, [assignments, historyQuery, showArchived]);

  const openCount = assignments.filter(
    (item) => assignmentStatus(item).tone === "active"
  ).length;
  const scheduledCount = assignments.filter(
    (item) => assignmentStatus(item).tone === "scheduled"
  ).length;
  const selectedSession =
    sessions.find((session) => session.id === selectedSessionId) ?? null;

  // Active step calculation
  const activeStep = !selectedCourseId ? 0 : !selectedTestId ? 1 : 2;

  const loadAssignments = useCallback(async (courseId: string) => {
    if (!courseId) {
      setAssignments([]);
      return;
    }
    setLoadingAssignments(true);
    setAssignmentError("");
    try {
      setAssignments(
        await apiFetch<TestAssignment[]>(
          `/admin/test-assignments?courseId=${encodeURIComponent(courseId)}`
        )
      );
    } catch (value) {
      setAssignments([]);
      setAssignmentError(
        value instanceof Error ? value.message : "Không tải được lịch sử giao đề."
      );
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
      const values = await apiFetch<ClassSession[]>(
        `/admin/courses/${courseId}/sessions`
      );
      setSessions(values);
      setSelectedSessionId((current) =>
        current && values.some((session) => session.id === current)
          ? current
          : values[0]?.id ?? ""
      );
    } catch (value) {
      setSessions([]);
      setSelectedSessionId("");
      setAssignmentError(
        value instanceof Error
          ? value.message
          : "Không tải được session của khóa học."
      );
    }
  }, []);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [coursePageData, testPageData] = await Promise.all([
        apiFetch<Page<Course>>(
          `${
            isTeacher ? "/admin/courses/assigned" : "/admin/courses"
          }?active=true&size=100&sort=startsOn,desc`
        ),
        apiFetch<Page<TestBankSummary>>("/admin/test-bank?status=PUBLISHED&size=50"),
      ]);
      setCourses(coursePageData.content);
      setTests(testPageData.content);

      const availableCourses = coursePageData.content.filter(
        (course) =>
          course.isActive && course.skillPair === coursePairForSkill(skill)
      );
      const nextCourseId =
        selectedCourseId &&
        availableCourses.some((course) => course.id === selectedCourseId)
          ? selectedCourseId
          : availableCourses[0]?.id ?? "";
      setSelectedCourseId(nextCourseId);
      if (nextCourseId) {
        await Promise.all([
          loadAssignments(nextCourseId),
          loadSessions(nextCourseId),
        ]);
      } else {
        setSessions([]);
        setSelectedSessionId("");
      }
    } catch (value) {
      setError(
        value instanceof Error ? value.message : "Không tải được dữ liệu giao đề."
      );
    } finally {
      setLoading(false);
    }
  }, [isTeacher, loadAssignments, loadSessions, selectedCourseId, skill]);

  useEffect(() => {
    void loadWorkspace();
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
    void Promise.all([loadAssignments(courseId), loadSessions(courseId)]);
  }

  function changeSkill(next: AssignmentSkill) {
    setSkill(next);
    setSelectedTestId("");
    setCourseQuery("");
    setTestQuery("");
    setSuccess("");
    const nextCourses = courses.filter(
      (course) =>
        course.isActive && course.skillPair === coursePairForSkill(next)
    );
    const nextCourseId = nextCourses[0]?.id ?? "";
    setSelectedCourseId(nextCourseId);
    const params = new URLSearchParams(searchParams);
    params.set("skill", next);
    params.delete("testId");
    nextCourseId
      ? params.set("courseId", nextCourseId)
      : params.delete("courseId");
    setSearchParams(params, { replace: true });
    void Promise.all([
      loadAssignments(nextCourseId),
      loadSessions(nextCourseId),
    ]);
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
    if (!selectedSessionId) return "Vui lòng chọn session nhận đề.";
    if (!selectedTest?.publishedVersion)
      return `Vui lòng chọn một đề ${skillLabel(skill)} đã xuất bản.`;
    const maxAttempts = Number(composer.maxAttempts);
    if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 10) {
      return "Số lượt làm phải từ 1 đến 10.";
    }
    const durationMinutes = Number(composer.durationMinutes);
    if (
      !Number.isInteger(durationMinutes) ||
      durationMinutes < 1 ||
      durationMinutes > 240
    ) {
      return "Thời lượng phải từ 1 đến 240 phút.";
    }
    if (
      composer.opensAt &&
      composer.closesAt &&
      new Date(composer.closesAt) <= new Date(composer.opensAt)
    ) {
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
      sessionId: selectedSessionId,
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
      setAssignmentError(
        value instanceof Error ? value.message : "Không thể giao đề lúc này."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function archiveAssignment(item: TestAssignment) {
    const confirmed = window.confirm(
      `Lưu trữ “${item.testTitle}”? Học viên sẽ không thể bắt đầu lượt làm mới từ bài giao này.`
    );
    if (!confirmed) return;

    setArchivingId(item.id);
    setAssignmentError("");
    try {
      await apiFetch<void>(`/admin/test-assignments/${item.id}`, {
        method: "DELETE",
      });
      setAssignments((current) =>
        current.map((value) =>
          value.id === item.id
            ? { ...value, archivedAt: new Date().toISOString() }
            : value
        )
      );
      setSuccess(`Đã lưu trữ bài giao “${item.testTitle}”.`);
    } catch (value) {
      setAssignmentError(
        value instanceof Error ? value.message : "Không thể lưu trữ bài giao."
      );
    } finally {
      setArchivingId(null);
    }
  }

  // Render Skill Badge for test card
  function renderSkillBadge(testSkill: AssignmentSkill) {
    switch (testSkill) {
      case "READING":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-sky-200/90 bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-800 shadow-2xs">
            <BookOpenText size={11} weight="fill" className="text-sky-600" />
            <span>READING</span>
          </span>
        );
      case "LISTENING":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-indigo-200/90 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-800 shadow-2xs">
            <Headphones size={11} weight="fill" className="text-indigo-600" />
            <span>LISTENING</span>
          </span>
        );
      case "WRITING":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-amber-200/90 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 shadow-2xs">
            <PencilSimpleLine size={11} weight="fill" className="text-amber-600" />
            <span>WRITING</span>
          </span>
        );
      case "SPEAKING":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-rose-200/90 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-800 shadow-2xs">
            <Microphone size={11} weight="fill" className="text-rose-600" />
            <span>SPEAKING</span>
          </span>
        );
    }
  }

  if (loading) return <WorkspaceSkeleton />;

  if (error) {
    return (
      <section
        className="mx-auto max-w-[1440px] rounded-2xl border border-rose-300 bg-rose-50/50 p-6"
        role="alert"
      >
        <div className="flex items-start gap-3">
          <WarningCircle
            size={24}
            weight="fill"
            className="mt-0.5 shrink-0 text-rose-600"
          />
          <div>
            <h1 className="font-display text-lg font-bold text-rose-950">
              Không tải được màn hình giao đề
            </h1>
            <p className="mt-1 text-sm text-rose-800">{error}</p>
            <button
              type="button"
              onClick={() => void loadWorkspace()}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-700"
            >
              <ArrowClockwise size={16} /> Thử lại
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-4 pb-12">
      {/* =========================================================================
          A. HEADER GỌN: TITLE + SKILL SWITCHER + STEPPER + METRICS BAR
      ========================================================================= */}
      <header className="rounded-2xl border border-outline-variant/30 bg-surface px-4 py-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Title & Description */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#8B3F56]/10 text-[#8B3F56] flex items-center justify-center shrink-0">
              <PaperPlaneTilt size={20} weight="duotone" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-lg sm:text-xl font-black text-on-surface tracking-tight">
                  Giao đề kiểm tra
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#8B3F56]/10 text-[#8B3F56]">
                  {skillLabel(skill)}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant line-clamp-1">
                Phân phối đề thi IELTS theo khóa học, cài đặt chế độ và giám sát làm bài.
              </p>
            </div>
          </div>

          {/* Skill Selector Tabs */}
          <div
            className="flex items-center bg-surface-container p-1 rounded-xl border border-outline-variant/30 self-start sm:self-auto text-xs font-bold"
            aria-label="Kỹ năng cần giao"
          >
            {(["LISTENING", "READING", "WRITING", "SPEAKING"] as const).map(
              (value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => changeSkill(value)}
                  aria-pressed={skill === value}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    skill === value
                      ? "bg-white text-[#8B3F56] shadow-xs font-black"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface/50"
                  }`}
                >
                  {skillLabel(value)}
                </button>
              )
            )}
          </div>
        </div>

        {/* Sub-bar: Compact Stepper & Metrics */}
        <div className="mt-3 pt-2.5 border-t border-outline-variant/20 flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs">
          {/* Stepper 3 Bước */}
          <ol className="flex items-center gap-1.5 sm:gap-3 flex-wrap">
            {[
              { step: 0, label: "1. Chọn khóa học", done: !!selectedCourseId },
              { step: 1, label: "2. Chọn đề thi", done: !!selectedTestId },
              { step: 2, label: "3. Cấu hình & giao", done: !!(selectedCourseId && selectedTestId && selectedSessionId) },
            ].map((item, idx) => (
              <li key={item.step} className="flex items-center gap-1.5 sm:gap-2">
                {idx > 0 && <span className="text-outline-variant/60 font-mono text-[10px]">→</span>}
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold transition-colors ${
                    item.done
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : activeStep === item.step
                      ? "bg-[#8B3F56]/10 text-[#8B3F56] border border-[#8B3F56]/20"
                      : "bg-surface-container-low text-on-surface-variant/70 border border-transparent"
                  }`}
                >
                  {item.done && <Check size={11} weight="bold" className="text-emerald-600" />}
                  {item.label}
                </span>
              </li>
            ))}
          </ol>

          {/* Metrics summary */}
          <div className="flex items-center gap-3 text-[11px] font-semibold text-on-surface-variant shrink-0">
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-[#8B3F56]" />
              <strong className="text-on-surface font-bold">{publishedTests.length}</strong> đề đã xuất bản
            </span>
            <span className="text-outline-variant/60">•</span>
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <strong className="text-on-surface font-bold">{openCount}</strong> đang mở
            </span>
            <span className="text-outline-variant/60">•</span>
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-amber-500" />
              <strong className="text-on-surface font-bold">{scheduledCount}</strong> sắp mở
            </span>
          </div>
        </div>
      </header>

      {/* Global Alerts (Success or Error) */}
      {(success || assignmentError) && (
        <div
          className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs sm:text-sm ${
            assignmentError
              ? "border-rose-300 bg-rose-50/70 text-rose-900"
              : "border-emerald-300 bg-emerald-50/70 text-emerald-900"
          }`}
          role={assignmentError ? "alert" : "status"}
          aria-live="polite"
        >
          {assignmentError ? (
            <WarningCircle size={18} weight="fill" className="mt-0.5 shrink-0 text-rose-600" />
          ) : (
            <CheckCircle size={18} weight="fill" className="mt-0.5 shrink-0 text-emerald-600" />
          )}
          <span className="font-semibold">{assignmentError || success}</span>
        </div>
      )}

      {/* =========================================================================
          B. KHU VỰC LÀM VIỆC CHÍNH: LAYOUT HAI CỘT (67% - 33%)
      ========================================================================= */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5 items-start">
        {/* =====================================================================
            CỘT TRÁI (8/12 - 67%): CHỌN KHÓA HỌC & NGÂN HÀNG ĐỀ THI
        ===================================================================== */}
        <div className="xl:col-span-8 space-y-4">
          {/* -----------------------------------------------------------------
              SECTION 1: CHỌN KHÓA HỌC NHẬN ĐỀ (VỚI ẢNH ĐẠI DIỆN KHÓA HỌC)
          ----------------------------------------------------------------- */}
          <section
            className="rounded-2xl border border-outline-variant/30 bg-surface p-4 shadow-xs"
            aria-labelledby="course-selection-heading"
          >
            {/* Header: Title + Search on same row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-[#8B3F56]/10 text-[#8B3F56] flex items-center justify-center text-xs font-black shrink-0">
                  1
                </span>
                <div>
                  <h2
                    id="course-selection-heading"
                    className="font-display text-sm sm:text-base font-extrabold text-on-surface"
                  >
                    Chọn khóa học nhận đề
                  </h2>
                  <p className="text-[11px] text-on-surface-variant">
                    Khóa học {coursePairForSkill(skill)} đang hoạt động ({filteredCourses.length})
                  </p>
                </div>
              </div>

              {/* Course Search */}
              <div className="relative sm:w-64">
                <MagnifyingGlass
                  size={15}
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/70"
                />
                <input
                  value={courseQuery}
                  onChange={(e) => setCourseQuery(e.target.value)}
                  placeholder="Tìm mã hoặc tên khóa..."
                  className="h-8.5 w-full rounded-lg border border-outline-variant/50 bg-surface-container-low pl-8 pr-2.5 text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Course Cards with Cover Images */}
            <div className="pt-3">
              {filteredCourses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-low/40">
                  <Student size={28} weight="duotone" className="text-[#8B3F56]/60 mb-1" />
                  <p className="text-xs font-bold text-on-surface">Không tìm thấy khóa học phù hợp</p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    Thử tìm với từ khóa khác hoặc chuyển sang kỹ năng khác.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {paginatedCourses.map((course) => {
                      const selected = selectedCourseId === course.id;
                      return (
                        <button
                          key={course.id}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => changeCourse(course.id)}
                          className={`group relative text-left rounded-xl border p-2.5 sm:p-3 flex items-center gap-3 transition-all ${
                            selected
                              ? "border-[#8B3F56] bg-[#8B3F56]/5 shadow-xs ring-1 ring-[#8B3F56]/30"
                              : "border-outline-variant/40 bg-surface hover:border-[#8B3F56]/40 hover:bg-surface-container-low/50"
                          }`}
                        >
                          {/* Left: Course Avatar / Cover Image */}
                          <div className="w-16 h-16 sm:w-18 sm:h-18 shrink-0 rounded-lg overflow-hidden border border-outline-variant/30 relative bg-surface-container-low flex items-center justify-center">
                            {course.coverImageUrl ? (
                              <AuthenticatedMediaImage
                                fileUrl={course.coverImageUrl}
                                alt={course.coverImageAltText || course.name}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-[#8B3F56]/5 text-[#8B3F56]">
                                <GraduationCap size={22} weight="duotone" />
                                <span className="text-[9px] font-bold mt-0.5 text-on-surface-variant">Khóa học</span>
                              </div>
                            )}
                          </div>

                          {/* Right: Course Info */}
                          <div className="min-w-0 flex-1">
                            {/* Row 1: Code + Radio Check */}
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-[10px] font-mono font-black text-[#8B3F56] uppercase tracking-wider bg-[#8B3F56]/10 px-1.5 py-0.5 rounded truncate">
                                {course.code}
                              </span>
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                  selected
                                    ? "border-[#8B3F56] bg-[#8B3F56] text-white"
                                    : "border-outline-variant bg-white"
                                }`}
                              >
                                {selected && <Check size={10} weight="bold" />}
                              </div>
                            </div>

                            {/* Row 2: Name */}
                            <strong
                              className="mt-1 block text-xs font-bold text-on-surface line-clamp-1 group-hover:text-[#8B3F56] transition-colors"
                              title={course.name}
                            >
                              {course.name}
                            </strong>

                            {/* Row 3: Meta details */}
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-on-surface-variant">
                              <span>
                                {shortDateLabel(course.startsOn)} - {shortDateLabel(course.endsOn)}
                              </span>
                              <span>•</span>
                              <span className="font-semibold">{course.totalSessions} buổi</span>
                              {course.targetBand && (
                                <>
                                  <span>•</span>
                                  <span className="font-bold text-emerald-700 bg-emerald-50 px-1 rounded">
                                    Band {course.targetBand}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Course Pagination Controls */}
                  {totalCoursePages > 1 && (
                    <div className="flex items-center justify-between pt-2 text-[11px] text-on-surface-variant border-t border-outline-variant/20">
                      <span>
                        Hiển thị {paginatedCourses.length} trên {filteredCourses.length} khóa
                      </span>
                      <div className="flex items-center gap-1 font-bold">
                        <button
                          type="button"
                          onClick={() => setCoursePage((p) => Math.max(1, p - 1))}
                          disabled={coursePage === 1}
                          className="p-1 rounded-lg hover:bg-surface-container disabled:opacity-30 disabled:pointer-events-none"
                          aria-label="Trang trước"
                        >
                          <CaretLeft size={13} weight="bold" />
                        </button>
                        <span className="px-1.5">
                          {coursePage} / {totalCoursePages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCoursePage((p) => Math.min(totalCoursePages, p + 1))}
                          disabled={coursePage === totalCoursePages}
                          className="p-1 rounded-lg hover:bg-surface-container disabled:opacity-30 disabled:pointer-events-none"
                          aria-label="Trang sau"
                        >
                          <CaretRight size={13} weight="bold" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* -----------------------------------------------------------------
              SECTION 2: NGÂN HÀNG ĐỀ THI ĐÃ XUẤT BẢN (GIAO DIỆN NGÂN HÀNG ĐỀ THU NHỎ)
          ----------------------------------------------------------------- */}
          <section
            className="rounded-2xl border border-outline-variant/30 bg-surface p-4 shadow-xs"
            aria-labelledby="test-selection-heading"
          >
            {/* Header: Title + Count */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-[#8B3F56]/10 text-[#8B3F56] flex items-center justify-center text-xs font-black shrink-0">
                  2
                </span>
                <div>
                  <h2
                    id="test-selection-heading"
                    className="font-display text-sm sm:text-base font-extrabold text-on-surface"
                  >
                    Chọn đề {skillLabel(skill)} đã xuất bản
                  </h2>
                  <p className="text-[11px] text-on-surface-variant">
                    Phiên bản đề thi được ghim cố định cho đợt giao
                  </p>
                </div>
              </div>

              {/* Total count badge */}
              <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-lg self-start sm:self-auto">
                {filteredTests.length} đề thi khả dụng
              </span>
            </div>

            {/* Filter toolbar: Search + Format + Sort on same row */}
            <div className="pt-3 pb-2 flex flex-col sm:flex-row items-center gap-2 text-xs">
              {/* Search */}
              <div className="relative flex-1 w-full">
                <MagnifyingGlass
                  size={15}
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/70"
                />
                <input
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  placeholder="Tìm mã đề, tiêu đề hoặc tag..."
                  className="h-8.5 w-full rounded-lg border border-outline-variant/50 bg-surface-container-low pl-8 pr-2.5 text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Filter by Test Type */}
              <div className="relative shrink-0 w-full sm:w-auto">
                <select
                  value={testTypeFilter}
                  onChange={(e) => setTestTypeFilter(e.target.value)}
                  className="h-8.5 w-full appearance-none rounded-lg border border-outline-variant/50 bg-surface-container-low pl-2.5 pr-7 text-xs font-semibold text-on-surface focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="ALL">Tất cả định dạng</option>
                  <option value="FULL_TEST">Full Test (60 phút)</option>
                  <option value="SINGLE_SKILL">Single Skill / Mini</option>
                </select>
                <CaretDown
                  size={12}
                  className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant"
                />
              </div>

              {/* Sort by */}
              <div className="relative shrink-0 w-full sm:w-auto">
                <select
                  value={testSort}
                  onChange={(e) => setTestSort(e.target.value)}
                  className="h-8.5 w-full appearance-none rounded-lg border border-outline-variant/50 bg-surface-container-low pl-2.5 pr-7 text-xs font-semibold text-on-surface focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="duration_desc">Thời lượng (giảm dần)</option>
                  <option value="duration_asc">Thời lượng (tăng dần)</option>
                  <option value="questions">Số câu hỏi nhiều nhất</option>
                </select>
                <CaretDown
                  size={12}
                  className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant"
                />
              </div>
            </div>

            {/* Test Cards: Miniature Test Bank Cards (GIỐNG NGÂN HÀNG ĐỀ THU NHỎ) */}
            <div className="pt-2">
              {filteredTests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-low/40">
                  <BookOpenText size={32} weight="duotone" className="text-[#8B3F56]/60 mb-1.5" />
                  <p className="text-xs font-bold text-on-surface">Không tìm thấy đề thi phù hợp</p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    Thử tìm với từ khóa khác hoặc xuất bản thêm đề trong Ngân hàng đề.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {paginatedTests.map((test) => {
                      const selected = selectedTestId === test.id;
                      const thumbnailImageUrl =
                        test.writingTaskImage?.fileUrl || test.coverImage?.fileUrl;
                      const isFullTest =
                        test.testType === "FULL_TEST" || (test.sectionsCount && test.sectionsCount > 1);

                      return (
                        <article
                          key={test.id}
                          onClick={() => selectTest(test.id)}
                          className={`group cursor-pointer flex flex-col overflow-hidden rounded-2xl border transition-all duration-200 text-left ${
                            selected
                              ? "border-[#8B3F56] ring-2 ring-[#8B3F56]/25 bg-white shadow-md -translate-y-0.5"
                              : "border-outline-variant/40 bg-white hover:border-[#8B3F56]/40 hover:shadow-sm hover:-translate-y-0.5"
                          }`}
                        >
                          {/* 1. Miniature Cover Image Container */}
                          <div className="relative h-28 overflow-hidden border-b border-outline-variant/30 bg-[#f4f0f3]">
                            {thumbnailImageUrl ? (
                              <AuthenticatedMediaImage
                                fileUrl={thumbnailImageUrl}
                                alt={test.title}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-[#f4f0f3] text-[#8B3F56]">
                                <ImageIcon size={24} weight="duotone" />
                                <span className="text-[10px] font-bold">Chưa có ảnh minh họa</span>
                              </div>
                            )}

                            {/* Top-Right Status Badge (Published) */}
                            <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white/95 px-2 py-0.5 text-[10px] font-bold text-emerald-800 shadow-2xs backdrop-blur-xs">
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              Published
                            </span>

                            {/* Top-Left Radio Checkmark Indicator */}
                            <div
                              className={`absolute left-2.5 top-2.5 size-5 rounded-full border-2 flex items-center justify-center shadow-xs transition-all ${
                                selected
                                  ? "border-[#8B3F56] bg-[#8B3F56] text-white"
                                  : "border-slate-300 bg-white/90 backdrop-blur-xs"
                              }`}
                            >
                              {selected && <Check size={11} weight="bold" />}
                            </div>
                          </div>

                          {/* 2. Miniature Card Body (Like Test Bank) */}
                          <div className="p-3 flex flex-1 flex-col justify-between">
                            <div>
                              {/* Code & Version */}
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="truncate text-[11px] font-bold text-[#8B3F56]">
                                  {test.code}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded shrink-0">
                                  {test.publishedVersion?.versionLabel || test.version || "v1.0"}
                                </span>
                              </div>

                              {/* Title */}
                              <h3
                                className="mt-1 font-display text-xs sm:text-sm font-extrabold leading-snug text-slate-900 line-clamp-2 min-h-[2.5rem] group-hover:text-[#8B3F56] transition-colors"
                                title={test.title}
                              >
                                {test.title}
                              </h3>

                              {/* Badges Row (Skill + Format/Sub-type) */}
                              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                {renderSkillBadge(test.skill as AssignmentSkill)}

                                {isFullTest ? (
                                  <span className="inline-flex items-center gap-1 rounded-md border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-extrabold text-purple-900 shadow-2xs">
                                    <Cards size={11} weight="fill" className="text-purple-700" />
                                    <span>Full đề (Full Test)</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                                    <span>{formatLabelOf(test)}</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Footer Metadata */}
                            <p className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] font-medium text-slate-500 flex items-center gap-1.5 flex-wrap">
                              <span>
                                {test.skill === "WRITING"
                                  ? `${test.sectionsCount || 2} task`
                                  : test.skill === "SPEAKING"
                                  ? `${test.sectionsCount || 3} part`
                                  : `${test.totalQuestions || 40} câu`}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{test.durationMinutes || 60} phút</span>
                              <span aria-hidden="true">·</span>
                              <span>
                                Cập nhật {shortDateLabel(test.updatedAt || test.publishedVersion?.publishedAt)}
                              </span>
                            </p>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {/* Test Bank Pagination Controls */}
                  {totalTestPages > 1 && (
                    <div className="flex items-center justify-between pt-2 text-xs text-on-surface-variant border-t border-outline-variant/20">
                      <span>
                        Hiển thị <strong>{paginatedTests.length}</strong> trên <strong>{filteredTests.length}</strong> đề thi
                      </span>
                      <div className="flex items-center gap-1 font-bold">
                        <button
                          type="button"
                          onClick={() => setTestPage((p) => Math.max(1, p - 1))}
                          disabled={testPage === 1}
                          className="px-2.5 py-1 rounded-lg border border-outline-variant/40 bg-surface hover:bg-surface-container disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1"
                        >
                          <CaretLeft size={13} weight="bold" /> Trước
                        </button>
                        <span className="px-2">
                          {testPage} / {totalTestPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setTestPage((p) => Math.min(totalTestPages, p + 1))}
                          disabled={testPage === totalTestPages}
                          className="px-2.5 py-1 rounded-lg border border-outline-variant/40 bg-surface hover:bg-surface-container disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1"
                        >
                          Sau <CaretRight size={13} weight="bold" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* =====================================================================
            CỘT PHẢI (4/12 - 33%): PANEL CẤU HÌNH GIAO ĐỀ (STICKY DESKTOP)
        ===================================================================== */}
        <aside className="xl:col-span-4 xl:sticky xl:top-4 xl:self-start">
          <div className="rounded-2xl border border-outline-variant/40 bg-surface p-4 shadow-sm space-y-3.5">
            {/* Header */}
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-outline-variant/20">
              <span className="w-6 h-6 rounded-lg bg-[#8B3F56]/10 text-[#8B3F56] flex items-center justify-center text-xs font-black shrink-0">
                3
              </span>
              <div>
                <h2 className="font-display text-sm sm:text-base font-extrabold text-on-surface leading-tight">
                  Cấu hình & Giao đề
                </h2>
                <p className="text-[11px] text-on-surface-variant">
                  Áp dụng cho học viên đang ghi danh
                </p>
              </div>
            </div>

            {/* 1. Live Summary Card (Khóa học + Đề thi kèm thumbnail) */}
            <div className="rounded-xl bg-surface-container-low/70 border border-outline-variant/25 p-2.5 space-y-2 text-xs">
              {/* Course row */}
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-lg overflow-hidden border border-outline-variant/30 bg-white shrink-0 flex items-center justify-center">
                  {selectedCourse?.coverImageUrl ? (
                    <AuthenticatedMediaImage
                      fileUrl={selectedCourse.coverImageUrl}
                      alt={selectedCourse.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <GraduationCap size={18} className="text-[#8B3F56]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant block">
                    Khóa nhận đề
                  </span>
                  {selectedCourse ? (
                    <strong className="block font-bold text-on-surface truncate text-xs">
                      {selectedCourse.code} · {selectedCourse.name}
                    </strong>
                  ) : (
                    <span className="text-amber-700 font-semibold text-[11px] block">
                      ⚠️ Chưa chọn khóa học
                    </span>
                  )}
                </div>
              </div>

              {/* Test row */}
              <div className="flex items-center gap-2.5 pt-2 border-t border-outline-variant/20">
                <div className="size-9 rounded-lg overflow-hidden border border-outline-variant/30 bg-white shrink-0 flex items-center justify-center">
                  {selectedTest?.coverImage?.fileUrl || selectedTest?.writingTaskImage?.fileUrl ? (
                    <AuthenticatedMediaImage
                      fileUrl={
                        selectedTest.writingTaskImage?.fileUrl ||
                        selectedTest.coverImage?.fileUrl ||
                        ""
                      }
                      alt={selectedTest.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <BookOpenText size={18} className="text-[#8B3F56]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant block">
                    Đề thi gán
                  </span>
                  {selectedTest ? (
                    <strong className="block font-bold text-on-surface truncate text-xs">
                      {selectedTest.code} · {selectedTest.title} ({selectedTest.publishedVersion?.versionLabel || "v1.0"})
                    </strong>
                  ) : (
                    <span className="text-amber-700 font-semibold text-[11px] block">
                      ⚠️ Chưa chọn đề thi
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Session Selector */}
            <div>
              <label htmlFor="session-select" className="block text-xs font-bold text-on-surface mb-1">
                Session nhận đề <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="session-select"
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="h-9 w-full appearance-none rounded-xl border border-outline-variant/60 bg-surface pl-3 pr-8 text-xs font-bold text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="">Chọn buổi học (Session)</option>
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      Session {session.sessionNo} · {session.title || "Chưa đặt tên"}
                    </option>
                  ))}
                </select>
                <CaretDown
                  size={12}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
                />
              </div>
              <p className="mt-1 text-[10px] text-on-surface-variant">
                Xuất hiện trong Session {selectedSession?.sessionNo ?? "..."} của Course Progress.
              </p>
            </div>

            {/* 3. Assignment Mode: Segmented Toggle */}
            <div>
              <span className="block text-xs font-bold text-on-surface mb-1.5">
                Chế độ làm bài
              </span>
              <div className="grid grid-cols-2 gap-1.5 bg-surface-container-low p-1 rounded-xl border border-outline-variant/30">
                <button
                  type="button"
                  aria-pressed={composer.mode === "PRACTICE"}
                  onClick={() => setComposer((c) => ({ ...c, mode: "PRACTICE" }))}
                  className={`py-1.5 px-2 rounded-lg text-left transition-all ${
                    composer.mode === "PRACTICE"
                      ? "bg-white text-[#8B3F56] shadow-xs font-black"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="block text-xs font-bold leading-tight">Luyện tập</span>
                  <span className="block text-[10px] text-on-surface-variant mt-0.5 leading-tight">
                    Tự do, xem đáp án
                  </span>
                </button>
                <button
                  type="button"
                  aria-pressed={composer.mode === "EXAM"}
                  onClick={() => setComposer((c) => ({ ...c, mode: "EXAM" }))}
                  className={`py-1.5 px-2 rounded-lg text-left transition-all ${
                    composer.mode === "EXAM"
                      ? "bg-white text-[#8B3F56] shadow-xs font-black"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="block text-xs font-bold leading-tight">Thi thử</span>
                  <span className="block text-[10px] text-on-surface-variant mt-0.5 leading-tight">
                    Mô phỏng thi thật
                  </span>
                </button>
              </div>
            </div>

            {/* 4. OpensAt & ClosesAt (Side-by-side) */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                  Mở bài
                </label>
                <input
                  type="datetime-local"
                  value={composer.opensAt}
                  onChange={(e) => setComposer((c) => ({ ...c, opensAt: e.target.value }))}
                  className="h-8.5 w-full rounded-lg border border-outline-variant/60 bg-surface px-2 text-[11px] text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                  Đóng bài
                </label>
                <input
                  type="datetime-local"
                  value={composer.closesAt}
                  onChange={(e) => setComposer((c) => ({ ...c, closesAt: e.target.value }))}
                  className="h-8.5 w-full rounded-lg border border-outline-variant/60 bg-surface px-2 text-[11px] text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            {/* 5. Max Attempts & Duration (Side-by-side) */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                  Số lượt làm
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={composer.maxAttempts}
                  onChange={(e) => setComposer((c) => ({ ...c, maxAttempts: e.target.value }))}
                  className="h-8.5 w-full rounded-lg border border-outline-variant/60 bg-surface px-2.5 text-xs font-bold text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                  Thời lượng (phút)
                </label>
                <input
                  type="number"
                  min={1}
                  max={240}
                  value={composer.durationMinutes}
                  onChange={(e) => setComposer((c) => ({ ...c, durationMinutes: e.target.value }))}
                  className="h-8.5 w-full rounded-lg border border-outline-variant/60 bg-surface px-2.5 text-xs font-bold text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            {/* 6. Show Results After Submit */}
            <label className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-low/40 cursor-pointer hover:bg-surface-container-low transition-colors">
              <span className="flex items-center gap-2">
                {composer.showResultAfterSubmit ? (
                  <Eye size={16} className="text-[#8B3F56]" />
                ) : (
                  <EyeSlash size={16} className="text-on-surface-variant" />
                )}
                <div>
                  <span className="block text-xs font-bold text-on-surface leading-tight">
                    Hiện kết quả sau nộp
                  </span>
                  <span className="block text-[10px] text-on-surface-variant mt-0.5">
                    Cho phép học viên xem đáp án chi tiết
                  </span>
                </div>
              </span>
              <input
                type="checkbox"
                checked={composer.showResultAfterSubmit}
                onChange={(e) =>
                  setComposer((c) => ({ ...c, showResultAfterSubmit: e.target.checked }))
                }
                className="size-4 rounded border-outline-variant text-[#8B3F56] focus:ring-[#8B3F56]"
              />
            </label>

            {/* 7. Action Button & Condition Prompts */}
            <div className="pt-2 border-t border-outline-variant/20">
              {/* Missing Requirements Guidance */}
              {(!selectedCourseId || !selectedTest || !selectedSessionId) && (
                <div className="mb-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-semibold space-y-0.5">
                  <div className="font-bold flex items-center gap-1 text-amber-950">
                    <WarningCircle size={13} weight="fill" className="text-amber-600" />
                    Cần hoàn tất trước khi giao:
                  </div>
                  {!selectedCourseId && <div>• Chọn khóa học nhận đề (Bước 1)</div>}
                  {!selectedTest && <div>• Chọn đề thi đã xuất bản (Bước 2)</div>}
                  {!selectedSessionId && <div>• Chọn Session trong khóa học (Bước 3)</div>}
                </div>
              )}

              {/* Primary Submit Button */}
              <button
                type="button"
                onClick={() => void submitAssignment()}
                disabled={submitting || !selectedCourseId || !selectedTest || !selectedSessionId}
                className="h-11 w-full rounded-xl bg-[#8B3F56] text-white font-extrabold text-sm shadow-xs flex items-center justify-center gap-2 transition-all hover:bg-[#723346] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {submitting ? (
                  <SpinnerGap size={18} className="animate-spin" />
                ) : (
                  <PaperPlaneTilt size={18} weight="bold" />
                )}
                <span>{submitting ? "Đang giao đề..." : "Giao đề cho khóa học"}</span>
              </button>
            </div>
          </div>
        </aside>
      </section>

      {/* =========================================================================
          F. LỊCH SỬ GIAO ĐỀ (HIGH DENSITY TABLE)
      ========================================================================= */}
      <section className="rounded-2xl border border-outline-variant/30 bg-surface p-4 sm:p-5 shadow-xs">
        {/* Table Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/20">
          <div>
            <h2 className="font-display text-base sm:text-lg font-extrabold text-on-surface">
              Lịch sử giao đề
            </h2>
            <p className="text-xs text-on-surface-variant">
              {selectedCourse
                ? `${selectedCourse.code} · ${selectedCourse.name}`
                : "Chọn khóa học để xem danh sách bài đã giao"}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            {/* Search History */}
            <div className="relative">
              <MagnifyingGlass
                size={15}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/70"
              />
              <input
                value={historyQuery}
                onChange={(e) => setHistoryQuery(e.target.value)}
                placeholder="Tìm bài đã giao..."
                className="h-8.5 w-full sm:w-56 rounded-lg border border-outline-variant/50 bg-surface-container-low pl-8 pr-2.5 text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Show Archived Checkbox */}
            <label className="inline-flex items-center gap-2 h-8.5 px-2.5 rounded-lg border border-outline-variant/50 bg-surface text-xs font-semibold text-on-surface cursor-pointer hover:bg-surface-container-low">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="size-3.5 rounded border-outline-variant text-[#8B3F56] focus:ring-[#8B3F56]"
              />
              Hiện đã lưu trữ
            </label>

            {/* Total items badge */}
            <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-lg">
              {filteredAssignments.length} bài giao
            </span>
          </div>
        </div>

        {/* Table Content */}
        {loadingAssignments ? (
          <div className="flex flex-col items-center justify-center py-10" role="status">
            <SpinnerGap size={24} className="animate-spin text-[#8B3F56] mb-2" />
            <span className="text-xs font-bold text-on-surface-variant">
              Đang tải lịch sử bài đã giao...
            </span>
          </div>
        ) : !selectedCourseId ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Student size={32} weight="duotone" className="text-[#8B3F56]/60 mb-2" />
            <p className="text-xs font-bold text-on-surface">Chưa chọn khóa học</p>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              Chọn khóa học ở danh sách bên trên để xem các bài đã giao.
            </p>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <PaperPlaneTilt size={32} weight="duotone" className="text-[#8B3F56]/60 mb-2" />
            <p className="text-xs font-bold text-on-surface">Chưa có đề nào được giao cho khóa này</p>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              Chọn đề thi và nhấn "Giao đề cho khóa học" để tạo bài giao đầu tiên.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto pt-2">
            <table className="w-full min-w-[850px] border-collapse text-left text-xs">
              <thead className="bg-surface-container-low/70 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                <tr>
                  <th className="px-3.5 py-2.5 rounded-l-lg">Đề đã giao</th>
                  <th className="px-3 py-2.5">Chế độ</th>
                  <th className="px-3 py-2.5">Thời gian mở / đóng</th>
                  <th className="px-3 py-2.5">Cấu hình</th>
                  <th className="px-3 py-2.5">Trạng thái</th>
                  <th className="px-3.5 py-2.5 text-right rounded-r-lg">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filteredAssignments.map((item) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-surface-container-low/50"
                  >
                    {/* Test Info */}
                    <td className="px-3.5 py-2.5">
                      <strong className="block font-bold text-on-surface max-w-xs truncate text-xs" title={item.testTitle}>
                        {item.testTitle}
                      </strong>
                      <span className="text-[10px] font-bold text-[#8B3F56]">
                        {item.versionLabel}
                      </span>
                    </td>

                    {/* Mode */}
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          item.mode === "EXAM"
                            ? "bg-purple-50 text-purple-800 border border-purple-200"
                            : "bg-blue-50 text-blue-800 border border-blue-200"
                        }`}
                      >
                        {item.mode === "EXAM" ? "Thi thử" : "Luyện tập"}
                      </span>
                    </td>

                    {/* Time */}
                    <td className="px-3 py-2.5 text-[11px] text-on-surface-variant leading-relaxed">
                      <div>Mở: <span className="font-semibold text-on-surface">{dateTimeLabel(item.opensAt)}</span></div>
                      <div>Đóng: <span className="font-semibold text-on-surface">{dateTimeLabel(item.closesAt)}</span></div>
                    </td>

                    {/* Config */}
                    <td className="px-3 py-2.5 text-[11px] text-on-surface-variant leading-relaxed">
                      <div><strong className="text-on-surface">{item.maxAttempts}</strong> lượt làm</div>
                      <div>
                        {item.durationSeconds
                          ? `${Math.round(item.durationSeconds / 60)} phút`
                          : "Theo thời lượng đề"}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2.5">
                      <StatusBadge assignment={item} />
                    </td>

                    {/* Actions */}
                    <td className="px-3.5 py-2.5 text-right">
                      {!item.archivedAt && (
                        <button
                          type="button"
                          onClick={() => void archiveAssignment(item)}
                          disabled={archivingId === item.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors disabled:opacity-50"
                        >
                          {archivingId === item.id ? (
                            <SpinnerGap size={13} className="animate-spin" />
                          ) : (
                            <Archive size={13} />
                          )}
                          <span>Lưu trữ</span>
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
