"use client";

import type {
  IeltsSkill,
  PageResponse,
  PracticeProgressFilter,
  StudentPracticeCatalogItem,
} from "@ielts/contracts";
import {
  ArrowLeft,
  ArrowCounterClockwise,
  ArrowRight,
  BookOpenText,
  CaretDown,
  ChartBar,
  ChartLineUp,
  Check,
  CheckCircle,
  CircleNotch,
  Clock,
  ClockCountdown,
  FunnelSimple,
  Headphones,
  MagnifyingGlass,
  Microphone,
  PencilCircle,
  PencilSimpleLine,
  Play,
  Sparkle,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import Link from "next/link";
import Image from "next/image";
import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PracticeCoverImage } from "@/features/practice/PracticeCoverImage";
import { getPracticeCatalog } from "@/features/practice/practiceApi";
import { questionTypeOption, questionTypesBySkill } from "@/features/practice/questionTypeCatalog";
import { getReadingAttempt, startOrResumeSelfPractice } from "@/features/reading/readingApi";
import { getWritingAttempt, startOrResumeWritingSelfPractice } from "@/features/writing/writingApi";
import { getSpeakingAttempt, startOrResumeSpeakingSelfPractice } from "@/features/speaking/speakingApi";
import styles from "./StudentPracticePage.module.css";

const skills = [
  { id: "READING", label: "Reading", icon: BookOpenText },
  { id: "LISTENING", label: "Listening", icon: Headphones },
  { id: "WRITING", label: "Writing", icon: PencilSimpleLine },
  { id: "SPEAKING", label: "Speaking", icon: Microphone },
] as const;

const statusOptions: Array<{ value: PracticeProgressFilter; label: string }> = [
  { value: "ALL", label: "Tất cả" },
  { value: "NOT_STARTED", label: "Chưa làm" },
  { value: "IN_PROGRESS", label: "Đang làm" },
  { value: "COMPLETED", label: "Đã hoàn thành" },
];

const formats: Record<IeltsSkill, Array<{ value: string; label: string }>> = {
  READING: [
    { value: "ALL", label: "Tất cả dạng Reading" },
    { value: "PASSAGE_1", label: "Passage 1" },
    { value: "PASSAGE_2", label: "Passage 2" },
    { value: "PASSAGE_3", label: "Passage 3" },
    { value: "FULL", label: "Full Reading" },
  ],
  LISTENING: [
    { value: "ALL", label: "Tất cả dạng Listening" },
    { value: "SECTION_1", label: "Section 1" },
    { value: "SECTION_2", label: "Section 2" },
    { value: "SECTION_3", label: "Section 3" },
    { value: "SECTION_4", label: "Section 4" },
    { value: "FULL", label: "Full Listening" },
  ],
  WRITING: [
    { value: "ALL", label: "Tất cả dạng Writing" },
    { value: "TASK_1", label: "Task 1" },
    { value: "TASK_2", label: "Task 2" },
    { value: "FULL", label: "Full Writing" },
  ],
  SPEAKING: [
    { value: "ALL", label: "Tất cả dạng Speaking" },
    { value: "PART_1", label: "Part 1" },
    { value: "PART_2", label: "Part 2" },
    { value: "PART_3", label: "Part 3" },
    { value: "FULL", label: "Full Speaking" },
  ],
};

const emptyPage: PageResponse<StudentPracticeCatalogItem> = {
  content: [], page: 0, size: 24, totalElements: 0, totalPages: 0, first: true, last: true,
};

type ResumePrompt = {
  item: StudentPracticeCatalogItem;
  attemptId: string;
  answeredCount: number;
  remainingSeconds: number;
};

function isSkill(value: string | null): value is IeltsSkill {
  return skills.some((skill) => skill.id === value);
}

function isProgress(value: string | null): value is PracticeProgressFilter {
  return statusOptions.some((option) => option.value === value);
}

export default function StudentPracticePage() {
  return (
    <Suspense fallback={<PracticePageSkeleton />}>
      <PracticeRoute />
    </Suspense>
  );
}

function PracticeRoute() {
  const searchParams = useSearchParams();
  const skillParam = searchParams.get("skill");
  return isSkill(skillParam) ? <PracticeCatalog skill={skillParam} /> : <PracticeLanding />;
}

const landingDetails = {
  READING: {
    icon: BookOpenText,
    code: "01",
    status: "SẴN SÀNG",
    label: "Reading",
    description: "Mở các bài Reading đã được giao trong khóa học của bạn.",
    eyebrow: "READ · UNDERSTAND · MASTER",
    features: [
      { icon: ClockCountdown, label: "Đề thi bám sát format thật" },
      { icon: ChartLineUp, label: "Có chấm điểm và phân tích" },
      { icon: CheckCircle, label: "Luyện tập linh hoạt" },
    ],
  },
  LISTENING: {
    icon: Headphones,
    code: "02",
    status: "SẴN SÀNG",
    label: "Listening",
    description: "Luyện nghe theo Part 1–4 bám sát định dạng bài thi thật.",
    eyebrow: "LISTEN · FOLLOW · COMPREHEND",
    features: [],
  },
  WRITING: {
    icon: PencilCircle,
    code: "03",
    status: "SẴN SÀNG",
    label: "Writing",
    description: "Luyện Task 1, Task 2 và nhận phản hồi theo tiêu chí IELTS.",
    eyebrow: "WRITE · REFINE · PROGRESS",
    features: [],
  },
  SPEAKING: {
    icon: Microphone,
    code: "04",
    status: "SẴN SÀNG",
    label: "Speaking",
    description: "Luyện nói theo chủ đề, ghi âm và theo dõi tiến bộ.",
    eyebrow: "SPEAK · RECORD · GAIN CONFIDENCE",
    features: [],
  },
} as const;

const landingCardClasses = {
  READING: styles.landingReading,
  LISTENING: styles.landingListening,
  WRITING: styles.landingWriting,
  SPEAKING: styles.landingSpeaking,
};

function PracticeLanding() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  return (
    <main className={styles.landingPage}>
      <section className={styles.landingSkillGrid} aria-label="Chọn kỹ năng luyện đề">
        {skills.map((skill) => {
          const detail = landingDetails[skill.id];
          const Icon = detail.icon;
          return (
            <Link
              key={skill.id}
              href={`/student/practice?skill=${skill.id}`}
              className={`${styles.landingCard} ${landingCardClasses[skill.id]} ${styles.landingAvailableCard}`}
              aria-label={`Mở danh mục luyện IELTS ${detail.label}`}
            >
              <span className={styles.landingGlow} aria-hidden="true" />
              <div className={styles.landingCardTop}>
                <span className={styles.landingIconBox}><Icon size={24} weight="duotone" /></span>
                <span className={styles.landingStatus}><i aria-hidden="true" />{detail.status}</span>
                <span className={styles.landingModuleNumber} aria-hidden="true">{detail.code}</span>
              </div>

              <div className={styles.landingCopy}>
                <h2 className={styles.landingSkillName}>
                  <span className={styles.landingIelts}>IELTS</span>
                  {detail.label}
                </h2>
                <p className={styles.landingDescription}>{detail.description}</p>
              </div>

              <LandingArtwork skill={skill.id} />

              {skill.id === "READING" && detail.features.length ? (
                <ul className={styles.landingFeatureList} aria-label={`Điểm nổi bật của khu vực ${detail.label}`}>
                  {detail.features.map((feature) => {
                    const FeatureIcon = feature.icon;
                    return <li key={feature.label}><FeatureIcon size={17} weight="duotone" /><span>{feature.label}</span></li>;
                  })}
                </ul>
              ) : null}

              <div className={styles.landingCardFooter}>
                <span className={styles.landingMicroCopy}>{detail.eyebrow}</span>
                <span className={styles.landingAction}>
                  {`Bắt đầu ${detail.label}`}<ArrowRight size={16} weight="bold" />
                </span>
              </div>
            </Link>
          );
        })}
      </section>

      <footer className={styles.landingFooter}>
        <span />
        <em>Practice today.<br />Perform with confidence.</em>
        <small>READ / LISTEN<br />WRITE / SPEAK</small>
      </footer>
    </main>
  );
}

function LandingArtwork({ skill }: { skill: IeltsSkill }) {
  const artwork = {
    READING: {
      src: "/images/practice/reading-orbit-book.png",
      width: 1254,
      height: 1254,
      className: styles.landingReadingArt,
    },
    LISTENING: {
      src: "/images/practice/listening-orbit-headphones.png",
      width: 1536,
      height: 1024,
      className: styles.landingListeningArt,
    },
    WRITING: {
      src: "/images/practice/writing-orbit-pen.png",
      width: 1254,
      height: 1254,
      className: styles.landingWritingArt,
    },
    SPEAKING: {
      src: "/images/practice/speaking-orbit-microphone.png",
      width: 1254,
      height: 1254,
      className: styles.landingSpeakingArt,
    },
  } as const;
  const item = artwork[skill];

  return (
    <div className={`${styles.landingArtwork} ${item.className}`} aria-hidden="true">
      <Image
        className={styles.landingArtImage}
        src={item.src}
        alt=""
        width={item.width}
        height={item.height}
        sizes={skill === "READING" ? "(max-width: 900px) 62vw, 30vw" : "(max-width: 900px) 46vw, 20vw"}
        priority={skill === "READING"}
      />
    </div>
  );
}

function PracticeCatalog({ skill }: { skill: IeltsSkill }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const progressParam = searchParams.get("status");
  const progress: PracticeProgressFilter = isProgress(progressParam) ? progressParam : "ALL";
  const typeParam = searchParams.get("type");
  const testType: "ALL" | "FULL_TEST" | "SINGLE_SKILL" = typeParam === "FULL_TEST" || typeParam === "SINGLE_SKILL" ? typeParam : "ALL";
  const format = searchParams.get("format") ?? "ALL";
  const availableQuestionTypes = questionTypesBySkill[skill];
  const selectedQuestionTypes = (searchParams.get("questionTypes") ?? "")
    .split(",")
    .filter((value) => availableQuestionTypes.some((item) => item.id === value));
  const questionTypesKey = selectedQuestionTypes.join(",");
  const query = searchParams.get("q") ?? "";
  const currentPage = Math.max(0, Number(searchParams.get("page") ?? "1") - 1 || 0);
  const [searchDraft, setSearchDraft] = useState(query);
  const [result, setResult] = useState(emptyPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startingId, setStartingId] = useState("");
  const [resumePrompt, setResumePrompt] = useState<ResumePrompt | null>(null);
  const [resumeError, setResumeError] = useState("");
  const [modePrompt, setModePrompt] = useState<{ item: StudentPracticeCatalogItem } | null>(null);
  const [selectedMode, setSelectedMode] = useState<"PRACTICE" | "EXAM">("PRACTICE");
  const [filtersOpen, setFiltersOpen] = useState(true);

  function updateParams(updates: Record<string, string | null>, resetPage = true) {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === "ALL") next.delete(key);
      else next.set(key, value);
    });
    if (resetPage) next.delete("page");
    const suffix = next.toString();
    router.replace(suffix ? `${pathname}?${suffix}` : pathname, { scroll: false });
  }

  useEffect(() => setSearchDraft(query), [query]);

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 620px)");
    const syncFilterVisibility = () => setFiltersOpen(!mobile.matches);
    syncFilterVisibility();
    mobile.addEventListener("change", syncFilterVisibility);
    return () => mobile.removeEventListener("change", syncFilterVisibility);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    void getPracticeCatalog({ skill, query, testType, format, questionTypes: selectedQuestionTypes, progress, page: currentPage, size: 24 })
      .then((response) => {
        if (active) setResult(response);
      })
      .catch((failure) => {
        if (active) {
          setResult(emptyPage);
          setError(failure instanceof Error ? failure.message : "Không tải được danh mục luyện đề.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [currentPage, format, progress, query, questionTypesKey, skill, testType]);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    updateParams({ q: searchDraft.trim() || null });
  }

  function toggleQuestionType(id: string) {
    const next = selectedQuestionTypes.includes(id)
      ? selectedQuestionTypes.filter((value) => value !== id)
      : [...selectedQuestionTypes, id];
    updateParams({ questionTypes: next.length ? next.join(",") : null });
  }

  async function start(item: StudentPracticeCatalogItem, mode: "PRACTICE" | "EXAM" = "PRACTICE") {
    const isReady = item.deliveryReady || item.skill === "SPEAKING";
    if (!isReady) return;
    const skillPath = item.skill.toLowerCase();
    setStartingId(item.testVersionId);
    setError("");
    try {
      if (item.activeAttemptId) {
        const attempt = item.skill === "WRITING"
          ? await getWritingAttempt(item.activeAttemptId)
          : item.skill === "SPEAKING"
          ? await getSpeakingAttempt(item.activeAttemptId)
          : await getReadingAttempt(item.activeAttemptId, skillPath);
        setResumeError("");
        setResumePrompt({
          item,
          attemptId: item.activeAttemptId,
          answeredCount: attempt.responses.length,
          remainingSeconds: attempt.remainingSeconds,
        });
        return;
      }
      const isExam = mode === "EXAM";
      const querySuffix = isExam ? "?mode=exam" : "";
      if (item.skill === "WRITING") {
        const attempt = await startOrResumeWritingSelfPractice(item.testVersionId);
        if (typeof window !== "undefined") {
          localStorage.setItem(`ielts_attempt_mode_${attempt.attemptId}`, isExam ? "exam" : "practice");
          localStorage.setItem(`ielts_test_mode_${item.testVersionId}`, isExam ? "exam" : "practice");
        }
        router.push(`/student/writing/attempts/${attempt.attemptId}${querySuffix}`);
      } else if (item.skill === "SPEAKING") {
        const attempt = await startOrResumeSpeakingSelfPractice(item.testVersionId);
        router.push(`/student/speaking/attempts/${attempt.attemptId}`);
      } else {
        const attempt = await startOrResumeSelfPractice(item.testVersionId, item.skill);
        if (typeof window !== "undefined") {
          localStorage.setItem(`ielts_attempt_mode_${attempt.attemptId}`, isExam ? "exam" : "practice");
          localStorage.setItem(`ielts_test_mode_${item.testVersionId}`, isExam ? "exam" : "practice");
        }
        router.push(`/student/${skillPath}/attempts/${attempt.attemptId}${querySuffix}`);
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Không thể bắt đầu đề này.");
    } finally {
      setStartingId("");
    }
  }

  async function restart() {
    if (!resumePrompt) return;
    const { item } = resumePrompt;
    const skillPath = item.skill.toLowerCase();
    setStartingId(item.testVersionId);
    setResumeError("");
    try {
      const savedMode = typeof window !== "undefined"
        ? (localStorage.getItem(`ielts_attempt_mode_${resumePrompt.attemptId}`) || localStorage.getItem(`ielts_test_mode_${item.testVersionId}`))
        : null;
      const isExam = savedMode === "exam";
      const attempt = item.skill === "WRITING"
        ? await startOrResumeWritingSelfPractice(item.testVersionId, true)
        : item.skill === "SPEAKING"
        ? await startOrResumeSpeakingSelfPractice(item.testVersionId, true)
        : await startOrResumeSelfPractice(item.testVersionId, item.skill, true);
      let querySuffix = "";
      if (typeof window !== "undefined") {
        localStorage.setItem(`ielts_attempt_mode_${attempt.attemptId}`, isExam ? "exam" : "practice");
        localStorage.setItem(`ielts_test_mode_${item.testVersionId}`, isExam ? "exam" : "practice");
        if (isExam) querySuffix = "?mode=exam";
      }
      setResumePrompt(null);
      router.push(`/student/${skillPath}/attempts/${attempt.attemptId}${querySuffix}`);
    } catch (failure) {
      setResumeError(failure instanceof Error ? failure.message : "Không thể làm lại đề này.");
    } finally {
      setStartingId("");
    }
  }

  const currentSkill = skills.find((item) => item.id === skill) ?? skills[0];
  const CurrentSkillIcon = currentSkill.icon;
  const hasFilters = Boolean(query || testType !== "ALL" || format !== "ALL" || progress !== "ALL" || selectedQuestionTypes.length);

  return (
    <main className={`${styles.page} ${styles[skill.toLowerCase()]}`}>
      <header className={styles.hero}>
        <div className={styles.heroMain}>
          <div className={styles.heroKicker}>
            <Link href="/student/practice" className={styles.backToSkills}><ArrowLeft size={15} /> Tất cả kỹ năng</Link>
            <span aria-hidden="true" />
            <p className={styles.eyebrow}><Sparkle size={14} weight="fill" /> Thư viện tự luyện</p>
          </div>
          <div className={styles.heroCopy}>
            <h1>Luyện đề <em>IELTS</em></h1>
            <p>Select a skill and practice published tests at your own pace.</p>
          </div>
        </div>
        <div className={styles.metric} aria-label={`${result.totalElements} đề phù hợp`}>
          <span>Đang hiển thị</span><strong>{loading ? "-" : result.totalElements}</strong><small>đề {currentSkill.label}</small>
        </div>
      </header>

      <div className={styles.catalogNav}>
        <nav className={styles.skillTabs} aria-label="Chọn kỹ năng IELTS">
          {skills.map((item) => {
            const Icon = item.icon;
            const active = item.id === skill;
            return (
              <Link key={item.id} href={`/student/practice?skill=${item.id}`} className={styles[item.id.toLowerCase()]}
                aria-current={active ? "page" : undefined}>
                <Icon size={19} weight={active ? "fill" : "regular"} /><span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <section className={styles.statusBar} aria-label="Trạng thái làm đề">
          {statusOptions.map((option) => (
            <button key={option.value} type="button" aria-pressed={progress === option.value}
              onClick={() => updateParams({ status: option.value })}>{option.label}</button>
          ))}
        </section>
      </div>

      <div className={styles.workspace}>
        <aside className={styles.filters} aria-label={`Bộ lọc ${currentSkill.label}`}>
          <button type="button" className={styles.filterHeading} aria-expanded={filtersOpen}
            aria-controls="practice-filter-options" onClick={() => setFiltersOpen((open) => !open)}>
            <FunnelSimple size={19} /><span><strong>Bộ lọc</strong><small>{currentSkill.label}{hasFilters ? " · đang áp dụng" : ""}</small></span>
            <CaretDown size={17} weight="bold" />
          </button>
          <div id="practice-filter-options" className={`${styles.filterBody} ${filtersOpen ? styles.filterBodyOpen : ""}`}>
            <fieldset>
              <legend>Cấu trúc đề</legend>
              {[{ value: "ALL", label: "Tất cả" }, { value: "SINGLE_SKILL", label: "Bài lẻ" }, { value: "FULL_TEST", label: "Full đề" }].map((option) => (
                <label key={option.value}><input type="radio" name="test-type" checked={testType === option.value}
                  onChange={() => updateParams({ type: option.value })} /><span>{option.label}</span></label>
              ))}
            </fieldset>
            <fieldset>
              <legend>Dạng bài</legend>
              {formats[skill].map((option) => (
                <label key={option.value}><input type="radio" name="format" checked={format === option.value}
                  onChange={() => updateParams({ format: option.value })} /><span>{option.label}</span></label>
              ))}
            </fieldset>
            <fieldset className={styles.questionTypeGroup}>
              <legend>Dạng câu hỏi</legend>
              <p>Chọn một hoặc nhiều dạng</p>
              <div className={styles.questionTypeList}>
                {availableQuestionTypes.map((item) => {
                  const selected = selectedQuestionTypes.includes(item.id);
                  const ItemIcon = item.icon;
                  return (
                    <button key={item.id} type="button" className={styles.questionTypeButton}
                      aria-pressed={selected} onClick={() => toggleQuestionType(item.id)}>
                      <span className={styles.questionCheck}>{selected ? <Check size={12} weight="bold" /> : null}</span>
                      <span className={`${styles.questionTypeIcon} ${item.iconBg} ${item.iconColor}`}>
                        <ItemIcon size={14} weight="fill" />
                      </span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
            {hasFilters ? <button type="button" className={styles.clearFilters}
              onClick={() => { setSearchDraft(""); updateParams({ q: null, type: null, format: null, status: null, questionTypes: null }); }}>Xóa bộ lọc</button> : null}
          </div>
        </aside>

        <div className={styles.results}>
          <form className={styles.search} onSubmit={submitSearch} role="search">
            <MagnifyingGlass size={21} />
            <label className="sr-only" htmlFor="practice-search">Tìm theo tên hoặc mã đề</label>
            <input id="practice-search" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)}
              placeholder={`Tìm đề ${currentSkill.label} theo tên, mã hoặc chủ đề`} />
            <button type="submit">Tìm kiếm</button>
          </form>

          {error ? <div className={styles.error} role="alert"><WarningCircle size={20} weight="fill" />{error}</div> : null}
          {loading ? <CatalogSkeleton /> : null}
          {!loading && !error && result.content.length === 0 ? (
            <div className={styles.empty}>
              <CurrentSkillIcon size={42} weight="duotone" /><h2>Chưa có đề phù hợp</h2>
              <p>{hasFilters ? "Hãy thử từ khóa hoặc bộ lọc khác." : `Chưa có đề ${currentSkill.label} nào được xuất bản trong danh mục tự luyện.`}</p>
              {hasFilters ? <button type="button" onClick={() => { setSearchDraft(""); updateParams({ q: null, type: null, format: null, status: null, questionTypes: null }); }}>Xem tất cả đề</button> : null}
            </div>
          ) : null}
          {!loading && result.content.length > 0 ? (
            <div className={styles.catalog} aria-label={`Danh sách đề ${currentSkill.label}`}>
              {result.content.map((item) => (
                <PracticeCard
                  key={item.testVersionId}
                  item={item}
                  starting={startingId === item.testVersionId}
                  onStart={(clickedItem) => {
                    if (clickedItem.activeAttemptId) {
                      void start(clickedItem, "PRACTICE");
                    } else {
                      setModePrompt({ item: clickedItem });
                    }
                  }}
                />
              ))}
            </div>
          ) : null}

          {!loading && result.totalPages > 1 ? (
            <nav className={styles.pagination} aria-label="Phân trang danh mục đề">
              <button type="button" disabled={result.first} onClick={() => updateParams({ page: String(result.page) }, false)}>Trang trước</button>
              <span>Trang {result.page + 1}/{result.totalPages}</span>
              <button type="button" disabled={result.last} onClick={() => updateParams({ page: String(result.page + 2) }, false)}>Trang sau</button>
            </nav>
          ) : null}
        </div>
      </div>
      {resumePrompt ? (
        <ResumeAttemptDialog
          prompt={resumePrompt}
          busy={startingId === resumePrompt.item.testVersionId}
          error={resumeError}
          onClose={() => { setResumePrompt(null); setResumeError(""); }}
          onContinue={() => {
            let modeSuffix = "";
            if (typeof window !== "undefined") {
              const savedMode = localStorage.getItem(`ielts_attempt_mode_${resumePrompt.attemptId}`) || localStorage.getItem(`ielts_test_mode_${resumePrompt.item.testVersionId}`);
              if (savedMode === "exam") {
                modeSuffix = "?mode=exam";
              }
            }
            router.push(`/student/${resumePrompt.item.skill.toLowerCase()}/attempts/${resumePrompt.attemptId}${modeSuffix}`);
          }}
          onRestart={() => void restart()}
        />
      ) : null}
      {modePrompt ? (
        <ModeSelectionDialog
          prompt={modePrompt}
          selectedMode={selectedMode}
          onSelectMode={setSelectedMode}
          onClose={() => setModePrompt(null)}
          onSubmit={() => {
            const target = modePrompt.item;
            setModePrompt(null);
            void start(target, selectedMode);
          }}
          busy={startingId === modePrompt.item.testVersionId}
        />
      ) : null}
    </main>
  );
}

function ResumeAttemptDialog({
  prompt,
  busy,
  error,
  onClose,
  onContinue,
  onRestart,
}: {
  prompt: ResumePrompt;
  busy: boolean;
  error: string;
  onClose: () => void;
  onContinue: () => void;
  onRestart: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const total = Math.max(1, prompt.item.totalItems);
  const answered = Math.min(prompt.answeredCount, total);
  const progress = Math.round((answered / total) * 100);
  const unit = prompt.item.skill === "WRITING" ? "task" : "câu";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog ref={dialogRef} className={styles.resumeDialog} aria-labelledby="resume-attempt-title"
      onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          if (!busy) onClose();
        }
      }}>
      <button type="button" className={styles.resumeClose} onClick={onClose} disabled={busy} aria-label="Đóng">
        <X size={19} />
      </button>
      <span className={styles.resumeIcon}><ClockCountdown size={30} weight="duotone" /></span>
      <p className={styles.resumeEyebrow}>Bài làm chưa hoàn thành</p>
      <h2 id="resume-attempt-title">Bạn muốn tiếp tục hay làm lại?</h2>
      <p className={styles.resumeTitle}>{prompt.item.title}</p>
      <div className={styles.resumeSummary}>
        <div><strong>{answered}/{total}</strong><span>{unit} đã làm</span></div>
        <div><strong>{remainingTime(prompt.remainingSeconds)}</strong><span>thời gian còn lại</span></div>
      </div>
      <div className={styles.resumeProgress} aria-label={`Đã hoàn thành ${progress}%`}>
        <span style={{ width: `${progress}%` }} />
      </div>
      <p className={styles.resumeHint}>Chọn tiếp tục để trở lại đúng tiến độ đã lưu. Làm lại sẽ kết thúc lượt hiện tại và bắt đầu một lượt mới.</p>
      {error ? <p className={styles.resumeError} role="alert"><WarningCircle size={18} weight="fill" />{error}</p> : null}
      <div className={styles.resumeActions}>
        <button type="button" className={styles.restartButton} onClick={onRestart} disabled={busy}>
          {busy ? <CircleNotch size={18} className={styles.spin} /> : <ArrowCounterClockwise size={18} />}
          {busy ? "Đang tạo lượt mới" : "Làm lại từ đầu"}
        </button>
        <button type="button" className={styles.continueButton} onClick={onContinue} disabled={busy} autoFocus>
          <Play size={17} weight="fill" />Tiếp tục làm bài
        </button>
      </div>
    </dialog>
  );
}

function PracticePreviewMockup() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 280 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="280" height="140" fill="#faf8f5" />
      <rect x="0" y="0" width="280" height="20" fill="#ffffff" />
      <circle cx="16" cy="10" r="4" fill="#f97316" />
      <rect x="26" y="8" width="60" height="4" rx="2" fill="#e2e8f0" />
      <rect x="26" y="8" width="24" height="4" rx="2" fill="#f97316" />
      <rect x="210" y="6" width="24" height="8" rx="4" fill="#ffedd5" />
      <rect x="240" y="6" width="28" height="8" rx="4" fill="#f97316" />
      <rect x="12" y="28" width="120" height="100" rx="6" fill="#ffffff" stroke="#e2e8f0" />
      <rect x="20" y="36" width="50" height="6" rx="3" fill="#cbd5e1" />
      <rect x="20" y="48" width="104" height="4" rx="2" fill="#f1f5f9" />
      <rect x="20" y="56" width="96" height="4" rx="2" fill="#fef08a" />
      <rect x="20" y="64" width="100" height="4" rx="2" fill="#f1f5f9" />
      <rect x="20" y="76" width="40" height="14" rx="3" fill="#ecfdf5" stroke="#10b981" />
      <rect x="140" y="28" width="128" height="100" rx="6" fill="#ffffff" stroke="#e2e8f0" />
      <circle cx="152" cy="42" r="5" fill="#10b981" />
      <rect x="162" y="40" width="70" height="4" rx="2" fill="#94a3b8" />
      <circle cx="152" cy="60" r="3" stroke="#94a3b8" strokeWidth="1.5" />
      <rect x="162" y="58" width="80" height="4" rx="2" fill="#cbd5e1" />
      <circle cx="152" cy="74" r="3" stroke="#94a3b8" strokeWidth="1.5" />
      <rect x="162" y="72" width="65" height="4" rx="2" fill="#cbd5e1" />
      <rect x="148" y="104" width="112" height="14" rx="4" fill="#fff7ed" stroke="#fdba74" />
      <rect x="156" y="109" width="45" height="4" rx="2" fill="#ea580c" />
    </svg>
  );
}

function ExamPreviewMockup() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 280 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="280" height="140" fill="#ffffff" />
      <rect x="0" y="0" width="280" height="18" fill="#1e293b" />
      <rect x="10" y="6" width="70" height="5" rx="2" fill="#ffffff" />
      <rect x="210" y="6" width="40" height="5" rx="2" fill="#94a3b8" />
      <rect x="14" y="26" width="252" height="84" rx="4" fill="#ffffff" stroke="#94a3b8" />
      <line x1="14" y1="44" x2="266" y2="44" stroke="#cbd5e1" strokeWidth="1" />
      <line x1="14" y1="62" x2="266" y2="62" stroke="#cbd5e1" strokeWidth="1" />
      <line x1="14" y1="80" x2="266" y2="80" stroke="#cbd5e1" strokeWidth="1" />
      <line x1="14" y1="98" x2="266" y2="98" stroke="#cbd5e1" strokeWidth="1" />
      <line x1="80" y1="26" x2="80" y2="110" stroke="#cbd5e1" strokeWidth="1" />
      <line x1="150" y1="26" x2="150" y2="110" stroke="#cbd5e1" strokeWidth="1" />
      <line x1="210" y1="26" x2="210" y2="110" stroke="#cbd5e1" strokeWidth="1" />
      <rect x="86" y="49" width="36" height="9" rx="2" fill="#ffffff" stroke="#000000" strokeWidth="1" />
      <rect x="156" y="67" width="36" height="9" rx="2" fill="#ffffff" stroke="#000000" strokeWidth="1" />
      <rect x="86" y="85" width="36" height="9" rx="2" fill="#ffffff" stroke="#000000" strokeWidth="1" />
      <rect x="0" y="118" width="280" height="22" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
      <rect x="10" y="125" width="22" height="8" rx="2" fill="#000000" />
      <rect x="36" y="127" width="140" height="4" rx="2" fill="#64748b" />
      <rect x="236" y="122" width="14" height="14" rx="2" fill="#0f172a" />
      <rect x="254" y="122" width="14" height="14" rx="2" fill="#0f172a" />
    </svg>
  );
}

function ModeSelectionDialog({
  prompt,
  selectedMode,
  onSelectMode,
  onClose,
  onSubmit,
  busy,
}: {
  prompt: { item: StudentPracticeCatalogItem };
  selectedMode: "PRACTICE" | "EXAM";
  onSelectMode: (mode: "PRACTICE" | "EXAM") => void;
  onClose: () => void;
  onSubmit: () => void;
  busy: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={styles.modeDialog}
      aria-labelledby="mode-selection-title"
      onCancel={(e) => { e.preventDefault(); if (!busy) onClose(); }}
      onKeyDown={(e) => { if (e.key === "Escape" && !busy) { e.preventDefault(); onClose(); } }}
    >
      <div className={styles.modeHeader}>
        <span className={styles.modeTitleText}>
          [{prompt.item.title}] - {formatLabel(prompt.item)}
        </span>
        <button
          type="button"
          className={styles.modeCloseBtn}
          onClick={onClose}
          disabled={busy}
          aria-label="Đóng"
        >
          <X size={18} />
        </button>
      </div>

      <h3 id="mode-selection-title" className={styles.modeHeading}>
        Chọn giao diện làm bài
      </h3>

      <div className={styles.modeGrid}>
        {/* Option 1: Giao diện Luyện tập */}
        <div
          role="button"
          tabIndex={0}
          className={`${styles.modeCard} ${selectedMode === "PRACTICE" ? styles.modeCardSelected : ""}`}
          onClick={() => onSelectMode("PRACTICE")}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelectMode("PRACTICE"); }}
        >
          <div className={styles.modeCardPreview}>
            <PracticePreviewMockup />
          </div>
          <h4 className={styles.modeCardTitle}>
            Giao diện Luyện tập
          </h4>
          <p className={styles.modeCardDesc}>
            Hỗ trợ tối đa các chức năng: Tra từ vựng, gợi ý viết bài,... Phù hợp để luyện tập
          </p>
        </div>

        {/* Option 2: Giao diện Thi thật */}
        <div
          role="button"
          tabIndex={0}
          className={`${styles.modeCard} ${selectedMode === "EXAM" ? styles.modeCardSelected : ""}`}
          onClick={() => onSelectMode("EXAM")}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelectMode("EXAM"); }}
        >
          <span className={styles.modeBadgeExam}>Giống 100%</span>
          <div className={styles.modeCardPreview}>
            <ExamPreviewMockup />
          </div>
          <h4 className={styles.modeCardTitle}>
            Giao diện Thi thật
          </h4>
          <p className={styles.modeCardDesc}>
            Mô phỏng 100% giao diện thi máy, giúp các bạn quen với chức năng khi thi thật
          </p>
        </div>
      </div>

      <button
        type="button"
        className={styles.modeSubmitBtn}
        onClick={onSubmit}
        disabled={busy}
      >
        {busy ? <CircleNotch size={18} className={styles.spin} /> : null}
        <span>Bắt đầu làm bài</span>
      </button>
    </dialog>
  );
}

function remainingTime(seconds: number) {
  if (seconds <= 0) return "Đã hết giờ";
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return `${minutes} phút`;
}

function PracticeCard({ item, starting, onStart }: { item: StudentPracticeCatalogItem; starting: boolean; onStart: (item: StudentPracticeCatalogItem) => void }) {
  const Icon = item.skill === "READING" ? BookOpenText : item.skill === "LISTENING" ? Headphones : item.skill === "WRITING" ? PencilSimpleLine : Microphone;
  const resume = Boolean(item.activeAttemptId);
  const coverUrl = typeof item.coverImage?.fileUrl === "string" ? item.coverImage.fileUrl : "";
  const visibleQuestionTypes = (item.questionTypes ?? []).slice(0, 3);
  return (
    <article className={`${styles.card} ${styles[item.skill.toLowerCase()]}`}>
      <div className={styles.cover}>
        <div className={styles.coverFallback} aria-hidden="true"><ChartBar size={76} weight="duotone" /><Icon size={34} weight="fill" /></div>
        {coverUrl ? <PracticeCoverImage fileUrl={coverUrl} alt={item.coverImage.altText || ""} className={styles.coverImage} /> : null}
        <span className={styles.format}>{formatLabel(item)}</span>
      </div>
      <div className={styles.cardContent}>
        <div className={styles.cardMeta}><span className={resume ? styles.doing : item.attemptsCount > 0 ? styles.done : styles.ready}>{resume ? "Đang làm" : item.attemptsCount > 0 ? "Đã làm" : "Chưa làm"}</span></div>
        <h2>{item.title}</h2>
        <p>{item.description}</p>
        {visibleQuestionTypes.length ? <div className={styles.cardQuestionTypes} aria-label="Dạng câu hỏi trong đề">
          {visibleQuestionTypes.map((type) => {
            const option = questionTypeOption(item.skill, type);
            if (!option) return null;
            const TypeIcon = option.icon;
            return <span key={type}><TypeIcon size={12} weight="fill" />{option.label}</span>;
          })}
          {(item.questionTypes?.length ?? 0) > 3 ? <span>+{item.questionTypes.length - 3}</span> : null}
        </div> : null}
        <dl><div><Clock size={16} /><dt className="sr-only">Thời lượng</dt><dd>{item.durationMinutes} phút</dd></div><div><CheckCircle size={16} /><dt className="sr-only">Số câu hoặc task</dt><dd>{item.totalItems} {item.skill === "WRITING" ? "task" : "câu"}</dd></div></dl>
      </div>
      <footer className={styles.cardFooter}>
        <span>{item.lastScore == null ? `${item.attemptsCount} lượt đã làm` : `Điểm gần nhất: ${item.lastScore}`}</span>
        {(() => {
          const isReady = item.deliveryReady || item.skill === "SPEAKING";
          return (
            <button
              type="button"
              disabled={starting || !isReady}
              onClick={() => onStart(item)}
              title={!isReady ? "Trình làm bài cho kỹ năng này đang được hoàn thiện" : undefined}
            >
              {starting ? <CircleNotch size={17} className={styles.spin} /> : isReady ? <Play size={16} weight="fill" /> : <Sparkle size={16} />}
              {starting ? "Đang mở" : !isReady ? "Sắp mở" : resume ? "Tiếp tục" : "Bắt đầu"}{isReady ? <ArrowRight size={15} weight="bold" /> : null}
            </button>
          );
        })()}
      </footer>
    </article>
  );
}

function formatLabel(item: StudentPracticeCatalogItem) {
  if (item.format && item.format !== item.testType) return item.format.replaceAll("_", " ");
  return item.testType === "FULL_TEST" ? `Full ${item.skill.toLowerCase()}` : "Bài lẻ";
}

function CatalogSkeleton() {
  return <div className={styles.catalog} aria-busy="true" aria-label="Đang tải danh mục đề">{Array.from({ length: 8 }, (_, index) => <div key={index} className={styles.skeleton} />)}</div>;
}

function PracticePageSkeleton() {
  return <main className={styles.page} aria-busy="true"><div className={styles.heroSkeleton} /><CatalogSkeleton /></main>;
}
