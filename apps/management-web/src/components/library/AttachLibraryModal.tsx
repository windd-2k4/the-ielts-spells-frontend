import {
  BookOpen, Check, Clock, Exam, FileAudio, FilePdf, FileText, FolderOpen,
  Headphones, Image as ImageIcon, MagnifyingGlass, Microphone, PencilSimpleLine,
  SpinnerGap, VideoCamera, X,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import type { Course, Page, SkillPair } from "../../academic-types";
import type {
  LearningResource, LibraryItem, LibrarySkill, TestBankItem, TestBankSummary,
} from "../../library-types";
import { isResource } from "../../library-types";
import { apiFetch } from "../../lib/api";
import AuthenticatedMediaImage from "../test-builder/AuthenticatedMediaImage";

export type SessionPickerItem = LearningResource | TestBankSummary;

function isTestBankItem(value: LibraryItem | TestBankItem): value is TestBankItem {
  return "testType" in value;
}

type SessionItem = {
  itemType: "MATERIAL" | "ASSIGNMENT" | "TEST";
  title: string;
  description?: string | null;
  sourceAssignmentId?: string | null;
  sourceTestId?: string | null;
  sourceResourceId?: string | null;
  sourceExerciseTemplateId?: string | null;
  deadlineAt?: string | null;
  required?: boolean;
  visibility?: "STUDENT" | "TEACHER";
};

type CourseSession = {
  id: string; sessionNo: number; title: string | null; startsAt: string; endsAt: string;
  zoomMeetingId: string | null; zoomUrl: string | null; status: string; notes: string | null;
  phaseName: string | null; content: string | null; teacherId: string | null; items: SessionItem[];
};

type Props = {
  open?: boolean;
  item?: LibraryItem | TestBankItem;
  courses?: Course[];
  courseId?: string;
  skillPair?: SkillPair;
  initialKind?: "ALL" | "MATERIAL" | "TEST";
  onClose: () => void;
  onSuccess?: () => void;
  onAttach?: (items: SessionPickerItem[]) => void;
};

const inputClass = "min-h-10 w-full rounded-xl border border-outline-variant/50 bg-surface px-3 text-xs sm:text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

const skillLabel: Record<string, string> = {
  LISTENING: "Listening",
  READING: "Reading",
  WRITING: "Writing",
  SPEAKING: "Speaking",
  FULL_TEST: "Full test",
};

const skillBadgeStyle: Record<string, { bg: string; text: string; border: string }> = {
  LISTENING: { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800" },
  READING: { bg: "bg-purple-50 dark:bg-purple-950/40", text: "text-purple-700 dark:text-purple-300", border: "border-purple-200 dark:border-purple-800" },
  WRITING: { bg: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-800" },
  SPEAKING: { bg: "bg-cyan-50 dark:bg-cyan-950/40", text: "text-cyan-700 dark:text-cyan-300", border: "border-cyan-200 dark:border-cyan-800" },
  FULL_TEST: { bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800" },
};

type ItemImageInfo = {
  fileUrl: string;
  altText: string;
};

export function getItemImageInfo(val: SessionPickerItem | LibraryItem | TestBankItem): ItemImageInfo | null {
  if ("testType" in val) {
    const test = val as TestBankSummary;
    // 1. Writing Task 1 or task illustration image
    if (test.writingTaskImage && typeof test.writingTaskImage === "object") {
      const fileUrl = typeof test.writingTaskImage.fileUrl === "string" ? test.writingTaskImage.fileUrl : "";
      if (fileUrl) {
        return {
          fileUrl,
          altText: typeof test.writingTaskImage.altText === "string" && test.writingTaskImage.altText
            ? test.writingTaskImage.altText
            : `Minh họa đề ${test.title}`,
        };
      }
    }

    // 2. Cover image directly on summary or item
    if (test.coverImage && typeof test.coverImage === "object") {
      const raw = test.coverImage as Record<string, unknown>;
      const fileUrl = typeof raw.fileUrl === "string" ? raw.fileUrl : typeof raw.url === "string" ? raw.url : "";
      if (fileUrl) {
        return {
          fileUrl,
          altText: typeof raw.altText === "string" && raw.altText ? (raw.altText as string) : `Ảnh bìa đề ${test.title}`,
        };
      }
    }

    // 3. Fallback to builderContent if present
    const content = (test as unknown as { builderContent?: Record<string, unknown> }).builderContent;
    if (content && typeof content === "object") {
      if (content.coverImage && typeof content.coverImage === "object") {
        const raw = content.coverImage as Record<string, unknown>;
        const fileUrl = typeof raw.fileUrl === "string" ? raw.fileUrl : typeof raw.url === "string" ? raw.url : "";
        if (fileUrl) {
          return {
            fileUrl,
            altText: typeof raw.altText === "string" && raw.altText ? (raw.altText as string) : `Ảnh bìa đề ${test.title}`,
          };
        }
      }
      const tasks = content.tasks;
      if (Array.isArray(tasks)) {
        const task = tasks.find(
          (t) => typeof t === "object" && t !== null && typeof (t as Record<string, unknown>).imageUrl === "string" && (t as Record<string, unknown>).imageUrl
        );
        if (task) {
          const rawTask = task as Record<string, unknown>;
          return {
            fileUrl: rawTask.imageUrl as string,
            altText: typeof rawTask.imageAltText === "string" && rawTask.imageAltText ? (rawTask.imageAltText as string) : `Minh họa đề ${test.title}`,
          };
        }
      }
    }

    return null;
  }

  // LearningResource
  const resource = val as LearningResource;
  const preview = resource.previewFile;
  if (preview) {
    const mime = (preview.mimeType || "").toLowerCase();
    const isImage = mime.startsWith("image/") || preview.fileRole === "THUMBNAIL" || preview.originalFilename?.match(/\.(png|jpe?g|webp|gif|svg)$/i);
    if (isImage) {
      return {
        fileUrl: preview.fileUrl || `/admin/library/files/${preview.id}/content`,
        altText: preview.originalFilename || `Tài liệu ${resource.title}`,
      };
    }
  }

  if (resource.externalUrl && resource.externalUrl.match(/\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i)) {
    return {
      fileUrl: resource.externalUrl,
      altText: `Tài liệu ${resource.title}`,
    };
  }

  return null;
}

function ItemThumbnail({
  item,
  isTest,
  skillStyle,
}: {
  item: SessionPickerItem;
  isTest: boolean;
  skillStyle: { bg: string; text: string; border: string };
}) {
  const imageInfo = useMemo(() => getItemImageInfo(item), [item]);

  return (
    <div className="relative h-20 w-24 sm:h-22 sm:w-28 shrink-0 overflow-hidden rounded-xl border border-outline-variant/35 bg-surface-container flex items-center justify-center shadow-2xs">
      {imageInfo ? (
        <AuthenticatedMediaImage
          fileUrl={imageInfo.fileUrl}
          alt={imageInfo.altText}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : isTest ? (
        <div className={`flex h-full w-full flex-col items-center justify-center gap-1.5 p-2 text-center transition ${skillStyle.bg}`}>
          {item.skill === "LISTENING" ? (
            <Headphones size={24} weight="duotone" className={skillStyle.text} />
          ) : item.skill === "READING" ? (
            <BookOpen size={24} weight="duotone" className={skillStyle.text} />
          ) : item.skill === "WRITING" ? (
            <PencilSimpleLine size={24} weight="duotone" className={skillStyle.text} />
          ) : item.skill === "SPEAKING" ? (
            <Microphone size={24} weight="duotone" className={skillStyle.text} />
          ) : (
            <Exam size={24} weight="duotone" className={skillStyle.text} />
          )}
          <span className="text-[10px] font-bold text-on-surface-variant/80 line-clamp-1">
            Chưa có ảnh
          </span>
        </div>
      ) : (
        (() => {
          const res = item as LearningResource;
          const mime = (res.previewFile?.mimeType || "").toLowerCase();
          const ext = (res.previewFile?.originalFilename || "").split(".").pop()?.toUpperCase() || "";

          if (mime.includes("pdf") || ext === "PDF" || res.resourceType === "DOCUMENT") {
            return (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-rose-50/80 dark:bg-rose-950/20 p-2 text-center text-rose-700 dark:text-rose-300">
                <FilePdf size={24} weight="duotone" />
                <span className="text-[9px] font-black uppercase tracking-wider">{ext || "PDF"}</span>
              </div>
            );
          }
          if (mime.includes("audio") || ext === "MP3" || res.resourceType === "AUDIO") {
            return (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-amber-50/80 dark:bg-amber-950/20 p-2 text-center text-amber-700 dark:text-amber-300">
                <FileAudio size={24} weight="duotone" />
                <span className="text-[9px] font-black uppercase tracking-wider">{ext || "AUDIO"}</span>
              </div>
            );
          }
          if (mime.includes("video") || ext === "MP4" || res.resourceType === "VIDEO") {
            return (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-purple-50/80 dark:bg-purple-950/20 p-2 text-center text-purple-700 dark:text-purple-300">
                <VideoCamera size={24} weight="duotone" />
                <span className="text-[9px] font-black uppercase tracking-wider">{ext || "VIDEO"}</span>
              </div>
            );
          }
          return (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-sky-50/80 dark:bg-sky-950/20 p-2 text-center text-sky-700 dark:text-sky-300">
              <FileText size={24} weight="duotone" />
              <span className="text-[9px] font-black uppercase tracking-wider line-clamp-1">{res.category || "TÀI LIỆU"}</span>
            </div>
          );
        })()
      )}
    </div>
  );
}

export default function AttachLibraryModal({
  open = true,
  item,
  courses = [],
  courseId = "",
  skillPair,
  initialKind = "ALL",
  onClose,
  onSuccess,
  onAttach,
}: Props) {
  const pickerMode = !item && Boolean(onAttach);
  const [selectedCourseId, setSelectedCourseId] = useState(courseId);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [sessions, setSessions] = useState<CourseSession[]>([]);
  const [pickerItems, setPickerItems] = useState<SessionPickerItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [kind, setKind] = useState<"ALL" | "MATERIAL" | "TEST">(initialKind);
  const [skillFilter, setSkillFilter] = useState<"ALL" | LibrarySkill>("ALL");
  const [testTypeFilter, setTestTypeFilter] = useState<"ALL" | "SINGLE_SKILL" | "FULL_TEST">("ALL");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRequired, setIsRequired] = useState(true);
  const [visibility, setVisibility] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [submitting, setSubmitting] = useState(false);

  // Sync initialKind when opened
  useEffect(() => {
    if (open) {
      setKind(initialKind);
    }
  }, [open, initialKind]);

  // Escape key listener to close
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Direct attach mode: Load course sessions
  useEffect(() => {
    if (!open || pickerMode || !selectedCourseId) {
      if (!pickerMode) { setSessions([]); setSelectedSessionId(""); }
      return;
    }
    setLoading(true);
    setError("");
    void apiFetch<CourseSession[]>(`/admin/courses/${selectedCourseId}/sessions`)
      .then(result => {
        setSessions(result);
        setSelectedSessionId(current => result.some(session => session.id === current) ? current : result[0]?.id ?? "");
      })
      .catch(reason => setError(reason instanceof Error ? reason.message : "Không tải được danh sách buổi học."))
      .finally(() => setLoading(false));
  }, [open, pickerMode, selectedCourseId]);

  // Allowed skills based strictly on course skillPair
  const allowedSkills = useMemo<LibrarySkill[]>(() => {
    if (skillPair === "LISTENING_READING") return ["LISTENING", "READING"];
    if (skillPair === "SPEAKING_WRITING") return ["SPEAKING", "WRITING"];
    return [];
  }, [skillPair]);

  // Picker mode: Load tests and resources strictly filtered by course skillPair
  useEffect(() => {
    if (!open || !pickerMode) return;
    const resourceParams = new URLSearchParams({ size: "100", status: "PUBLISHED" });
    if (courseId) {
      resourceParams.set("courseId", courseId);
      resourceParams.set("includeGlobal", "true");
    }
    setLoading(true);
    setError("");
    setSelectedIds([]);
    setSkillFilter("ALL");
    setTestTypeFilter("ALL");

    const loadPickerItems = async () => {
      // Fetch tests strictly for the course's allowed skills
      const skillsToFetch = allowedSkills.length > 0 ? allowedSkills : ["LISTENING", "READING", "WRITING", "SPEAKING"];

      const emptyPage = { content: [], totalElements: 0, totalPages: 0, page: 0, size: 0, first: true, last: true };
      const [resources, ...testPages] = await Promise.all([
        apiFetch<Page<LearningResource>>(`/admin/library/resources?${resourceParams}`)
          .catch(() => emptyPage as Page<LearningResource>),
        ...skillsToFetch.map(skill =>
          apiFetch<Page<TestBankSummary>>(`/admin/test-bank?status=PUBLISHED&skill=${skill}&size=100`)
            .catch(() => emptyPage as Page<TestBankSummary>)
        ),
      ]);

      const allTests = testPages.flatMap(page => page.content);

      setPickerItems([
        ...resources.content,
        ...allTests,
      ]);
    };

    void loadPickerItems()
      .catch(reason => setError(reason instanceof Error ? reason.message : "Không tải được tài liệu và ngân hàng đề."))
      .finally(() => setLoading(false));
  }, [courseId, open, pickerMode, allowedSkills]);

  // Strictly filter items for this course:
  // - LR course: ONLY shows Listening and Reading tests!
  // - WS course: ONLY shows Writing and Speaking tests!
  const eligibleItems = useMemo(() => {
    return pickerItems.filter(value => {
      const isTest = "testType" in value;
      if (isTest) {
        if (!allowedSkills.length) return true;
        return allowedSkills.includes(value.skill as LibrarySkill);
      } else {
        // Material from Learning Resource
        if (allowedSkills.length > 0 && value.skill) {
          return allowedSkills.includes(value.skill as LibrarySkill);
        }
        return true;
      }
    });
  }, [allowedSkills, pickerItems]);

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi-VN");
    return eligibleItems.filter(value => {
      const isTest = "testType" in value;
      if (kind === "MATERIAL" && isTest) return false;
      if (kind === "TEST" && !isTest) return false;
      if (skillFilter !== "ALL" && value.skill !== skillFilter) return false;
      if (testTypeFilter !== "ALL" && (!isTest || value.testType !== testTypeFilter)) return false;

      const searchText = isTest
        ? `${value.code} ${value.title} ${value.skill} ${(value.tags ?? []).join(" ")}`
        : `${value.code} ${value.title} ${value.skill} ${value.category}`;
      return !normalizedQuery || searchText.toLocaleLowerCase("vi-VN").includes(normalizedQuery);
    });
  }, [eligibleItems, kind, query, skillFilter, testTypeFilter]);

  const pickerCounts = useMemo(() => ({
    ALL: eligibleItems.length,
    TEST: eligibleItems.filter(value => "testType" in value).length,
    MATERIAL: eligibleItems.filter(value => !("testType" in value)).length,
  }), [eligibleItems]);

  const selectedBreakdown = useMemo(() => {
    const selected = pickerItems.filter(value => selectedIds.includes(value.id));
    const testsCount = selected.filter(value => "testType" in value).length;
    const materialsCount = selected.filter(value => !("testType" in value)).length;
    return { testsCount, materialsCount, total: selected.length };
  }, [pickerItems, selectedIds]);

  const hasActiveFilters = Boolean(query.trim() || skillFilter !== "ALL" || testTypeFilter !== "ALL");

  function resetPickerFilters() {
    setQuery("");
    setSkillFilter("ALL");
    setTestTypeFilter("ALL");
  }

  function confirmPicker() {
    const selected = pickerItems.filter(value => selectedIds.includes(value.id));
    if (!selected.length) {
      setError("Vui lòng chọn ít nhất một bài tập hoặc tài liệu.");
      return;
    }
    onAttach?.(selected);
    onClose();
  }

  async function handleDirectAttach() {
    if (!item || !selectedCourseId || !selectedSessionId) {
      setError("Vui lòng chọn khóa học và buổi học cần gắn.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const session = sessions.find(value => value.id === selectedSessionId);
      if (!session) throw new Error("Buổi học đã chọn không còn tồn tại.");
      const isTest = isTestBankItem(item);
      const isExercise = "exerciseType" in item;
      const newItem: SessionItem = {
        itemType: isTest ? "TEST" : isExercise ? "ASSIGNMENT" : "MATERIAL",
        title: item.title,
        description: "description" in item ? item.description : "instructions" in item ? item.instructions : null,
        sourceTestId: isTest ? item.id : null,
        sourceResourceId: !isTest && isResource(item as LibraryItem) ? item.id : null,
        sourceExerciseTemplateId: isExercise ? item.id : null,
        required: isRequired,
        visibility,
      };
      await apiFetch(`/admin/courses/${selectedCourseId}/sessions/${selectedSessionId}`, {
        method: "PUT",
        body: JSON.stringify({
          sessionNo: session.sessionNo, title: session.title, startsAt: session.startsAt, endsAt: session.endsAt,
          zoomMeetingId: session.zoomMeetingId, zoomUrl: session.zoomUrl, status: session.status,
          notes: session.notes, phaseName: session.phaseName, content: session.content,
          teacherId: session.teacherId, items: [...(session.items ?? []), newItem],
        }),
      });
      onSuccess?.();
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể gắn học liệu vào buổi học.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  // PICKER MODE: Used inside CourseSchedule / SessionDrawer
  if (pickerMode) {
    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="library-picker-title"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <section className="relative flex flex-col w-full max-w-4xl max-h-[90vh] rounded-2xl border border-outline-variant/30 bg-surface shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Top Line Accent */}
          <div
            className={`h-1.5 w-full ${
              kind === "TEST" ? "bg-amber-500" : kind === "MATERIAL" ? "bg-sky-500" : "bg-primary"
            }`}
          />

          {/* Modal Header */}
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-outline-variant/20 bg-surface/95 px-5 py-3.5 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                  kind === "TEST"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                    : kind === "MATERIAL"
                      ? "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300"
                      : "bg-primary/10 text-primary dark:bg-primary/20"
                }`}
              >
                {kind === "TEST" ? (
                  <Exam size={22} weight="duotone" />
                ) : kind === "MATERIAL" ? (
                  <FolderOpen size={22} weight="duotone" />
                ) : (
                  <BookOpen size={22} weight="duotone" />
                )}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 id="library-picker-title" className="font-display text-base sm:text-lg font-extrabold text-on-surface">
                    {kind === "TEST"
                      ? "Giao bài tập từ Ngân hàng đề"
                      : kind === "MATERIAL"
                        ? "Đính kèm tài liệu từ Kho học liệu"
                        : "Chọn học liệu & bài tập cho buổi học"}
                  </h3>
                  {skillPair && (
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                        skillPair === "LISTENING_READING"
                          ? "bg-purple-100 text-purple-900 dark:bg-purple-950/40 dark:text-purple-300"
                          : "bg-rose-100 text-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
                      }`}
                    >
                      {skillPair === "LISTENING_READING" ? "Khóa LR (Listening & Reading)" : "Khóa WS (Writing & Speaking)"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {skillPair === "LISTENING_READING"
                    ? "Hệ thống chỉ hiển thị đề thi và bài tập Listening & Reading phù hợp với khóa học này."
                    : skillPair === "SPEAKING_WRITING"
                      ? "Hệ thống chỉ hiển thị đề thi và bài tập Writing & Speaking phù hợp với khóa học này."
                      : "Chọn nội dung cần đính kèm vào buổi học."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-outline-variant/40 text-on-surface-variant transition hover:bg-surface-container hover:text-on-surface cursor-pointer"
            >
              <X size={18} weight="bold" />
            </button>
          </header>

          {/* Source Tabs & Filters Toolbar */}
          <div className="border-b border-outline-variant/20 bg-surface-container-lowest/60 px-5 py-3 space-y-3">
            {/* Top Row: Search + Source Type Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Source Tabs */}
              <div className="flex rounded-xl border border-outline-variant/40 bg-surface p-1 shrink-0" role="group">
                <button
                  type="button"
                  onClick={() => {
                    setKind("TEST");
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    kind === "TEST"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  }`}
                >
                  <Exam size={15} weight={kind === "TEST" ? "bold" : "regular"} />
                  <span>Ngân hàng đề (Bài tập)</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                      kind === "TEST" ? "bg-white/20 text-white" : "bg-surface-container text-on-surface-variant"
                    }`}
                  >
                    {pickerCounts.TEST}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setKind("MATERIAL");
                    setTestTypeFilter("ALL");
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    kind === "MATERIAL"
                      ? "bg-sky-600 text-white shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  }`}
                >
                  <FolderOpen size={15} weight={kind === "MATERIAL" ? "bold" : "regular"} />
                  <span>Kho học liệu (Tài liệu)</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                      kind === "MATERIAL" ? "bg-white/20 text-white" : "bg-surface-container text-on-surface-variant"
                    }`}
                  >
                    {pickerCounts.MATERIAL}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setKind("ALL");
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                    kind === "ALL"
                      ? "bg-primary text-on-primary shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  }`}
                >
                  <span>Tất cả</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                      kind === "ALL" ? "bg-on-primary/20 text-on-primary" : "bg-surface-container text-on-surface-variant"
                    }`}
                  >
                    {pickerCounts.ALL}
                  </span>
                </button>
              </div>

              {/* Search Box */}
              <div className="relative flex-1 sm:max-w-xs">
                <MagnifyingGlass
                  size={15}
                  weight="bold"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm theo tên bài, mã đề..."
                  className={`${inputClass} pl-9 pr-7`}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface cursor-pointer"
                  >
                    <X size={13} weight="bold" />
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Row: Skill Filter + Structure Filter */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
                Kỹ năng:
              </span>
              <div className="flex flex-wrap gap-1" role="group">
                <button
                  type="button"
                  onClick={() => setSkillFilter("ALL")}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                    skillFilter === "ALL"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-outline-variant/40 bg-surface text-on-surface-variant hover:border-primary/40"
                  }`}
                >
                  Tất cả ({allowedSkills.length ? allowedSkills.map(s => skillLabel[s]).join(" & ") : "4 kỹ năng"})
                </button>

                {allowedSkills.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => setSkillFilter(skill)}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                      skillFilter === skill
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-outline-variant/40 bg-surface text-on-surface-variant hover:border-primary/40"
                    }`}
                  >
                    {skillLabel[skill]}
                  </button>
                ))}
              </div>

              {kind !== "MATERIAL" && (
                <>
                  <span className="mx-1 h-4 w-px bg-outline-variant/40 hidden sm:block" />
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
                    Cấu trúc:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(
                      [
                        ["ALL", "Tất cả"],
                        ["SINGLE_SKILL", "Bài lẻ"],
                        ["FULL_TEST", "Full đề"],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setTestTypeFilter(value)}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                          testTypeFilter === value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-outline-variant/40 bg-surface text-on-surface-variant hover:border-primary/40"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetPickerFilters}
                  className="ml-auto text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  Đặt lại lọc
                </button>
              )}
            </div>
          </div>

          {/* Items Grid (Scrollable) */}
          <div className="min-h-56 flex-1 overflow-y-auto bg-surface-container-low/20 p-4 sm:p-5">
            {error && (
              <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
                {error}
              </p>
            )}

            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="h-28 animate-pulse rounded-xl border border-outline-variant/25 bg-surface p-3.5 space-y-2">
                    <div className="h-4 w-24 rounded bg-surface-container-high" />
                    <div className="h-5 w-4/5 rounded bg-surface-container-high" />
                    <div className="h-3 w-1/2 rounded bg-surface-container" />
                  </div>
                ))}
              </div>
            ) : visibleItems.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {visibleItems.map((val) => {
                  const selected = selectedIds.includes(val.id);
                  const isTest = "testType" in val;
                  const skillStyle = skillBadgeStyle[val.skill] ?? {
                    bg: "bg-surface-container",
                    text: "text-on-surface",
                    border: "border-outline-variant/40",
                  };

                  return (
                    <button
                      key={val.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        setSelectedIds((current) =>
                          selected ? current.filter((id) => id !== val.id) : [...current, val.id]
                        )
                      }
                      className={`group relative rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                        selected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/30 shadow-xs"
                          : "border-outline-variant/35 bg-surface hover:border-primary/50 hover:shadow-xs"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <ItemThumbnail item={val} isTest={isTest} skillStyle={skillStyle} />

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="rounded-md bg-surface-container px-1.5 py-0.5 font-mono text-[10px] font-bold text-on-surface-variant">
                              {val.code}
                            </span>
                            <span
                              className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${skillStyle.bg} ${skillStyle.text} ${skillStyle.border}`}
                            >
                              {skillLabel[val.skill] || val.skill}
                            </span>
                            {isTest && (
                              <span className="rounded-md bg-surface-container-high px-1.5 py-0.5 text-[10px] font-semibold text-on-surface-variant">
                                {val.testType === "FULL_TEST" ? "Full đề" : "Bài lẻ"}
                              </span>
                            )}

                            {/* Selection Check Circle */}
                            <span
                              className={`ml-auto grid h-5 w-5 shrink-0 place-items-center rounded-full border transition ${
                                selected
                                  ? "border-primary bg-primary text-on-primary shadow-xs"
                                  : "border-outline-variant/60 text-transparent group-hover:border-primary/50"
                              }`}
                            >
                              <Check size={12} weight="bold" />
                            </span>
                          </div>

                          <h4 className="text-xs sm:text-sm font-bold text-on-surface line-clamp-2 leading-snug">
                            {val.title}
                          </h4>

                          {isTest ? (
                            <div className="flex items-center gap-3 text-[11px] font-medium text-on-surface-variant pt-1">
                              <span className="inline-flex items-center gap-1">
                                <FileText size={12} />
                                {val.totalQuestions} câu
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Clock size={12} />
                                {val.durationMinutes} phút
                              </span>
                              <span className="ml-auto text-[10px] font-bold text-amber-700 dark:text-amber-300">
                                Giao làm bài tập
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between text-[11px] font-medium text-on-surface-variant pt-1">
                              <span>Tài liệu · {val.category}</span>
                              <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300">
                                Tài liệu buổi học
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid min-h-48 place-items-center text-center p-6">
                <div className="space-y-2 max-w-sm">
                  <BookOpen size={34} className="mx-auto text-outline/50" />
                  <p className="text-sm font-bold text-on-surface">Không tìm thấy nội dung phù hợp</p>
                  <p className="text-xs text-on-surface-variant">
                    {query
                      ? `Không có bài thi hay tài liệu nào khớp với từ khóa "${query}".`
                      : `Chưa có bài thi đã xuất bản cho kỹ năng ${allowedSkills.map(s => skillLabel[s]).join(" & ")}.`}
                  </p>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={resetPickerFilters}
                      className="mt-2 inline-flex items-center rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/5 cursor-pointer"
                    >
                      Đặt lại bộ lọc
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <footer className="sticky bottom-0 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-outline-variant/20 bg-surface/95 px-5 py-3 backdrop-blur-md">
            <div>
              <span className="block text-xs font-bold text-on-surface">
                {selectedBreakdown.total > 0 ? (
                  <span>
                    Đã chọn:{" "}
                    <strong className="text-primary">{selectedBreakdown.testsCount} bài tập</strong>
                    {selectedBreakdown.materialsCount > 0 && (
                      <span>, <strong className="text-sky-700 dark:text-sky-300">{selectedBreakdown.materialsCount} tài liệu</strong></span>
                    )}
                  </span>
                ) : (
                  "Chưa chọn bài tập hoặc tài liệu nào"
                )}
              </span>
              <span className="block text-[11px] text-on-surface-variant/70">
                Bài tập từ Ngân hàng đề sẽ tự động gán deadline sau buổi học.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-outline-variant/50 px-4 py-2 text-xs sm:text-sm font-bold text-on-surface-variant hover:bg-surface-container transition cursor-pointer"
              >
                Hủy
              </button>

              <button
                type="button"
                disabled={!selectedIds.length}
                onClick={confirmPicker}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs sm:text-sm font-extrabold text-on-primary transition hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
              >
                <Check size={16} weight="bold" />
                <span>Thêm vào buổi học{selectedIds.length ? ` (${selectedIds.length})` : ""}</span>
              </button>
            </div>
          </footer>
        </section>
      </div>
    );
  }

  // DIRECT ATTACH MODE: Used in LibraryWorkspace
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
    >
      <section className="w-full max-w-lg space-y-4 rounded-2xl border border-outline-variant/30 bg-surface p-5 sm:p-6 shadow-2xl">
        <header className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
          <div>
            <h3 className="font-display text-lg font-bold text-on-surface">Gắn vào buổi học</h3>
            <p className="text-xs text-on-surface-variant">Chọn khóa học và buổi nhận học liệu</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container cursor-pointer"
          >
            <X size={20} />
          </button>
        </header>

        {item && (
          <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
            {(() => {
              const img = getItemImageInfo(item);
              if (img) {
                return (
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-outline-variant/30 bg-surface shadow-2xs">
                    <AuthenticatedMediaImage fileUrl={img.fileUrl} alt={img.altText} className="h-full w-full object-cover" />
                  </div>
                );
              }
              return null;
            })()}
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold text-primary">{item.code}</span>
              <h4 className="font-display text-sm font-bold text-on-surface truncate">{item.title}</h4>
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
            {error}
          </p>
        )}

        <div className="space-y-3.5">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-on-surface">Khóa học</span>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className={inputClass}
            >
              <option value="">Chọn khóa học</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold text-on-surface">Buổi học</span>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              disabled={!selectedCourseId || loading}
              className={inputClass}
            >
              <option value="">{loading ? "Đang tải..." : "Chọn buổi học"}</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  Session {s.sessionNo}
                  {s.title ? ` · ${s.title}` : ""}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className="mb-1 block text-xs font-bold text-on-surface">Yêu cầu</span>
              <select
                value={isRequired ? "YES" : "NO"}
                onChange={(e) => setIsRequired(e.target.value === "YES")}
                className={inputClass}
              >
                <option value="YES">Bắt buộc</option>
                <option value="NO">Tùy chọn</option>
              </select>
            </label>

            <label>
              <span className="mb-1 block text-xs font-bold text-on-surface">Hiển thị</span>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as "STUDENT" | "TEACHER")}
                className={inputClass}
              >
                <option value="STUDENT">Học viên & giáo viên</option>
                <option value="TEACHER">Chỉ giáo viên</option>
              </select>
            </label>
          </div>
        </div>

        <footer className="flex justify-end gap-2 border-t border-outline-variant/30 pt-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-outline-variant/50 px-4 py-2 text-xs font-bold text-on-surface-variant hover:bg-surface-container cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => void handleDirectAttach()}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-on-primary transition hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? <SpinnerGap size={15} className="animate-spin" /> : <Check size={15} />}
            <span>Gắn học liệu</span>
          </button>
        </footer>
      </section>
    </div>
  );
}
