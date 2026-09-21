"use client";

import type {
  IeltsSkill,
  PageResponse,
  PracticeProgressFilter,
  StudentPracticeCatalogItem,
} from "@ielts/contracts";
import {
  ArrowLeft,
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
} from "@phosphor-icons/react";
import Link from "next/link";
import Image from "next/image";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PracticeCoverImage } from "@/features/practice/PracticeCoverImage";
import { getPracticeCatalog } from "@/features/practice/practiceApi";
import { questionTypeOption, questionTypesBySkill } from "@/features/practice/questionTypeCatalog";
import { startOrResumeSelfPractice } from "@/features/reading/readingApi";
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
    label: "IELTS Reading",
    description: "Mở các bài Reading đã được giao trong khóa học của bạn.",
    eyebrow: "ĐỌC · HIỂU · TĂNG TỐC",
    features: [
      { icon: ClockCountdown, label: "Đề thi bám sát format thật" },
      { icon: ChartLineUp, label: "Có chấm điểm và phân tích" },
      { icon: CheckCircle, label: "Luyện tập linh hoạt" },
    ],
  },
  LISTENING: {
    icon: Headphones,
    code: "02",
    status: "ĐANG PHÁT TRIỂN",
    label: "IELTS Listening",
    description: "Bài luyện nghe theo section và band mục tiêu.",
    eyebrow: "NGHE · BẮT NHỊP · THẤU HIỂU",
    features: [],
  },
  WRITING: {
    icon: PencilCircle,
    code: "03",
    status: "ĐANG PHÁT TRIỂN",
    label: "IELTS Writing",
    description: "Luyện Task 1, Task 2 và nhận phản hồi theo tiêu chí IELTS.",
    eyebrow: "VIẾT · CHỈNH SỬA · TIẾN BỘ",
    features: [],
  },
  SPEAKING: {
    icon: Microphone,
    code: "04",
    status: "ĐANG PHÁT TRIỂN",
    label: "IELTS Speaking",
    description: "Luyện nói theo chủ đề, ghi âm và theo dõi tiến bộ.",
    eyebrow: "NÓI · GHI ÂM · TỰ TIN",
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
      <header className={styles.landingHeader}>
        <div>
          <p className={styles.eyebrow}>SKILL PRACTICE</p>
          <h1><em>IELTS</em> Practice</h1>
          <p>Practice with published tests backed by complete scoring and review workflows.</p>
        </div>
        <div className={styles.landingSignature} aria-hidden="true">
          <span />
          <em>Practice with purpose.<br />Progress with confidence.</em>
          <small>PRACTICE<br />REVIEW<br />IMPROVE <b>•</b></small>
        </div>
      </header>

      <section className={styles.landingSkillGrid} aria-label="Chọn kỹ năng luyện đề">
        {skills.map((skill) => {
          const detail = landingDetails[skill.id];
          const Icon = detail.icon;
          const isReady = skill.id === "READING";
          return (
            <Link
              key={skill.id}
              href={`/student/practice?skill=${skill.id}`}
              className={`${styles.landingCard} ${landingCardClasses[skill.id]} ${isReady ? styles.landingAvailableCard : styles.landingUpcomingCard}`}
              aria-label={`Mở danh mục luyện ${detail.label}`}
            >
              <span className={styles.landingGlow} aria-hidden="true" />
              <div className={styles.landingCardTop}>
                <span className={styles.landingIconBox}><Icon size={24} weight="duotone" /></span>
                <span className={styles.landingStatus}><i aria-hidden="true" />{detail.status}</span>
                <span className={styles.landingModuleNumber} aria-hidden="true">{detail.code}</span>
              </div>

              <div className={styles.landingCopy}>
                <h2 className={styles.landingSkillName}>{detail.label}</h2>
                <p className={styles.landingDescription}>{detail.description}</p>
              </div>

              <LandingArtwork skill={skill.id} />

              {detail.features.length ? (
                <ul className={styles.landingFeatureList} aria-label="Điểm nổi bật của khu vực Reading">
                  {detail.features.map((feature) => {
                    const FeatureIcon = feature.icon;
                    return <li key={feature.label}><FeatureIcon size={17} weight="duotone" /><span>{feature.label}</span></li>;
                  })}
                </ul>
              ) : null}

              <div className={styles.landingCardFooter}>
                <span className={styles.landingMicroCopy}>{detail.eyebrow}</span>
                <span className={styles.landingAction}>
                  {isReady ? "Bắt đầu Reading" : "Xem danh mục"}<ArrowRight size={16} weight="bold" />
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

  async function start(item: StudentPracticeCatalogItem) {
    if (!item.deliveryReady) return;
    if (item.activeAttemptId) {
      router.push(`/student/reading/attempts/${item.activeAttemptId}`);
      return;
    }
    setStartingId(item.testVersionId);
    setError("");
    try {
      const attempt = await startOrResumeSelfPractice(item.testVersionId);
      router.push(`/student/reading/attempts/${attempt.attemptId}`);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Không thể bắt đầu đề này.");
    } finally {
      setStartingId("");
    }
  }

  const currentSkill = skills.find((item) => item.id === skill) ?? skills[0];
  const CurrentSkillIcon = currentSkill.icon;
  const hasFilters = Boolean(query || testType !== "ALL" || format !== "ALL" || progress !== "ALL" || selectedQuestionTypes.length);

  return (
    <main className={styles.page}>
      <Link href="/student/practice" className={styles.backToSkills}><ArrowLeft size={16} /> Tất cả kỹ năng</Link>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}><Sparkle size={15} weight="fill" /> Thư viện tự luyện</p>
          <h1>Luyện đề <em>IELTS</em></h1>
          <p>Chọn kỹ năng, tìm một đề đã xuất bản và luyện theo nhịp của riêng bạn. Kết quả tự luyện được lưu riêng với bài giáo viên giao.</p>
        </div>
        <div className={styles.metric} aria-label={`${result.totalElements} đề phù hợp`}>
          <span>Đang hiển thị</span><strong>{loading ? "-" : result.totalElements}</strong><small>đề {currentSkill.label}</small>
        </div>
      </header>

      <nav className={styles.skillTabs} aria-label="Chọn kỹ năng IELTS">
        {skills.map((item) => {
          const Icon = item.icon;
          const active = item.id === skill;
          return (
            <button key={item.id} type="button" aria-current={active ? "page" : undefined}
              onClick={() => updateParams({ skill: item.id, format: null, questionTypes: null })}>
              <Icon size={20} weight={active ? "fill" : "regular"} /><span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <section className={styles.statusBar} aria-label="Trạng thái làm đề">
        {statusOptions.map((option) => (
          <button key={option.value} type="button" aria-pressed={progress === option.value}
            onClick={() => updateParams({ status: option.value })}>{option.label}</button>
        ))}
      </section>

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
              {result.content.map((item) => <PracticeCard key={item.testVersionId} item={item}
                starting={startingId === item.testVersionId} onStart={start} />)}
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
    </main>
  );
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
        {coverUrl ? <PracticeCoverImage fileUrl={coverUrl} alt={item.coverImage.altText || `Ảnh minh họa ${item.title}`} className={styles.coverImage} /> : null}
        <span className={styles.format}>{formatLabel(item)}</span>
      </div>
      <div className={styles.cardContent}>
        <div className={styles.cardMeta}><span>{item.code}</span><span className={resume ? styles.doing : item.attemptsCount > 0 ? styles.done : styles.ready}>{resume ? "Đang làm" : item.attemptsCount > 0 ? "Đã làm" : "Chưa làm"}</span></div>
        <h2>{item.title}</h2><p>{item.description || "Đề luyện đã được kiểm duyệt và xuất bản trong ngân hàng đề."}</p>
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
        <button type="button" disabled={starting || !item.deliveryReady} onClick={() => onStart(item)} title={!item.deliveryReady ? "Trình làm bài cho kỹ năng này đang được hoàn thiện" : undefined}>
          {starting ? <CircleNotch size={17} className={styles.spin} /> : item.deliveryReady ? <Play size={16} weight="fill" /> : <Sparkle size={16} />}
          {starting ? "Đang mở" : !item.deliveryReady ? "Sắp mở" : resume ? "Tiếp tục" : "Bắt đầu"}{item.deliveryReady ? <ArrowRight size={15} weight="bold" /> : null}
        </button>
      </footer>
    </article>
  );
}

function formatLabel(item: StudentPracticeCatalogItem) {
  if (item.format && item.format !== item.testType) return item.format.replaceAll("_", " ");
  return item.testType === "FULL_TEST" ? `Full ${item.skill.toLowerCase()}` : "Bài lẻ";
}

function CatalogSkeleton() {
  return <div className={styles.catalog} aria-busy="true" aria-label="Đang tải danh mục đề">{Array.from({ length: 6 }, (_, index) => <div key={index} className={styles.skeleton} />)}</div>;
}

function PracticePageSkeleton() {
  return <main className={styles.page} aria-busy="true"><div className={styles.heroSkeleton} /><CatalogSkeleton /></main>;
}
