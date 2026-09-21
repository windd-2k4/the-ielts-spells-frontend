"use client";

import type { StudentReadingAssignment, StudentReadingCatalogItem } from "@ielts/contracts";
import {
  ArrowLeft, ArrowRight, BookOpenText, CalendarBlank, CheckCircle, CircleNotch,
  Clock, FunnelSimple, MagnifyingGlass, Play, Sparkle, Stack, WarningCircle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StudentSessionGate } from "@/features/student-auth/StudentSessionGate";
import { ReadingStatePanel } from "./ReadingStatePanel";
import { assignmentAvailability, formatDateTime, formatDuration, requestMessage } from "./readingFormat";
import {
  getPublishedReadingTests, getReadingAssignments,
  startOrResumeReadingAttempt, startOrResumeSelfPractice,
} from "./readingApi";
import styles from "./ReadingLibraryPage.module.css";

type LibraryTab = "practice" | "assigned";
type TestFilter = "ALL" | "SINGLE_SKILL" | "FULL_TEST";

export function ReadingAssignmentsPage() {
  return <StudentSessionGate><ReadingLibraryContent /></StudentSessionGate>;
}

function ReadingLibraryContent() {
  const router = useRouter();
  const [tab, setTab] = useState<LibraryTab>("practice");
  const [filter, setFilter] = useState<TestFilter>("ALL");
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState<StudentReadingCatalogItem[]>([]);
  const [assignments, setAssignments] = useState<StudentReadingAssignment[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [assignmentsError, setAssignmentsError] = useState("");
  const [startingId, setStartingId] = useState("");

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true); setCatalogError("");
    try { setCatalog(await getPublishedReadingTests()); }
    catch (failure) { setCatalogError(requestMessage(failure)); }
    finally { setCatalogLoading(false); }
  }, []);

  const loadAssignments = useCallback(async () => {
    setAssignmentsLoading(true); setAssignmentsError("");
    try { setAssignments(await getReadingAssignments()); }
    catch (failure) { setAssignmentsError(requestMessage(failure)); }
    finally { setAssignmentsLoading(false); }
  }, []);

  useEffect(() => { void loadCatalog(); void loadAssignments(); }, [loadAssignments, loadCatalog]);

  const visibleCatalog = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("vi");
    return catalog.filter((item) => {
      const matchesType = filter === "ALL" || item.testType === filter;
      const searchable = `${item.code} ${item.title} ${item.description ?? ""} ${item.tags.join(" ")}`.toLocaleLowerCase("vi");
      return matchesType && (!keyword || searchable.includes(keyword));
    });
  }, [catalog, filter, query]);

  async function startPractice(item: StudentReadingCatalogItem) {
    setStartingId(item.testVersionId); setCatalogError("");
    try {
      const attempt = await startOrResumeSelfPractice(item.testVersionId);
      router.push(`/student/reading/attempts/${attempt.attemptId}`);
    } catch (failure) { setCatalogError(requestMessage(failure)); }
    finally { setStartingId(""); }
  }

  async function startAssignment(assignmentId: string) {
    setStartingId(assignmentId); setAssignmentsError("");
    try {
      const attempt = await startOrResumeReadingAttempt(assignmentId);
      router.push(`/student/reading/attempts/${attempt.attemptId}`);
    } catch (failure) { setAssignmentsError(requestMessage(failure)); }
    finally { setStartingId(""); }
  }

  const activeError = tab === "practice" ? catalogError : assignmentsError;
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <Link href="/student/practice" className={styles.backLink}><ArrowLeft size={16} weight="bold" /> Quay lại luyện đề</Link>
          <p className={styles.eyebrow}><Sparkle size={14} weight="fill" /> Reading studio</p>
          <h1>Kho đề <em>Reading</em></h1>
          <p className={styles.lead}>Chọn đề đã xuất bản để luyện tự do, tiếp tục bài đang làm hoặc mở nhiệm vụ giáo viên giao.</p>
        </div>
        <div className={styles.heroMetric} aria-label={`${catalog.length} đề đang mở`}>
          <span>Đang mở</span><strong>{catalogLoading ? "–" : catalog.length.toString().padStart(2, "0")}</strong><small>đề Reading</small>
        </div>
      </header>

      <div className={styles.tabs} role="tablist" aria-label="Loại bài Reading">
        <button type="button" role="tab" aria-selected={tab === "practice"} onClick={() => setTab("practice")}>
          <Stack size={19} weight={tab === "practice" ? "fill" : "regular"} /> Luyện tập tự do <span>{catalog.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={tab === "assigned"} onClick={() => setTab("assigned")}>
          <BookOpenText size={19} weight={tab === "assigned" ? "fill" : "regular"} /> Bài tập được giao <span>{assignments.length}</span>
        </button>
      </div>

      {activeError ? <div className={styles.error} role="alert"><WarningCircle size={20} weight="fill" />{activeError}</div> : null}

      {tab === "practice" ? (
        <section className={styles.panel} role="tabpanel" aria-label="Đề luyện tập tự do">
          <div className={styles.toolbar}>
            <label className={styles.search}>
              <MagnifyingGlass size={19} /><span className="sr-only">Tìm đề Reading</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên đề, mã đề hoặc chủ đề" />
            </label>
            <div className={styles.filters} aria-label="Lọc cấu trúc đề">
              <FunnelSimple size={18} />
              {(["ALL", "SINGLE_SKILL", "FULL_TEST"] as TestFilter[]).map((value) => (
                <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>
                  {value === "ALL" ? "Tất cả" : value === "SINGLE_SKILL" ? "Bài lẻ" : "Full đề"}
                </button>
              ))}
            </div>
          </div>

          {catalogLoading ? <CatalogSkeleton /> : null}
          {!catalogLoading && catalogError ? <ReadingStatePanel title="Không tải được kho đề Reading" message={catalogError} actionLabel="Thử lại" onAction={() => void loadCatalog()} tone="error" /> : null}
          {!catalogLoading && !catalogError && catalog.length === 0 ? <ReadingStatePanel title="Chưa có đề Reading được xuất bản" message="Đề sẽ xuất hiện ở đây ngay khi vượt qua Publish Gate trên management web." /> : null}
          {!catalogLoading && !catalogError && catalog.length > 0 && visibleCatalog.length === 0 ? <ReadingStatePanel title="Không tìm thấy đề phù hợp" message="Hãy thử từ khóa khác hoặc chọn lại loại đề." /> : null}
          {!catalogLoading && !catalogError && visibleCatalog.length > 0 ? (
            <div className={styles.catalogGrid} aria-label="Danh sách đề Reading đã xuất bản">
              {visibleCatalog.map((item, index) => <PracticeCard key={item.testVersionId} item={item} index={index} starting={startingId === item.testVersionId} onStart={startPractice} />)}
            </div>
          ) : null}
        </section>
      ) : (
        <section className={styles.panel} role="tabpanel" aria-label="Bài Reading được giao">
          <div className={styles.sectionHeading}>
            <div><p className={styles.eyebrow}>Theo lớp học</p><h2>Nhiệm vụ của bạn</h2></div>
            <p>Thời hạn, số lượt làm và tiến độ được quản lý riêng theo từng khóa học.</p>
          </div>
          {assignmentsLoading ? <CatalogSkeleton compact /> : null}
          {!assignmentsLoading && assignmentsError ? <ReadingStatePanel title="Không tải được bài Reading được giao" message={assignmentsError} actionLabel="Thử lại" onAction={() => void loadAssignments()} tone="error" /> : null}
          {!assignmentsLoading && !assignmentsError && assignments.length === 0 ? <ReadingStatePanel title="Chưa có bài Reading nào được giao" message="Khi giáo viên giao bài cho khóa học của bạn, bài sẽ xuất hiện tại đây. Bạn vẫn có thể luyện tự do trong tab bên cạnh." actionLabel="Xem đề tự luyện" onAction={() => setTab("practice")} /> : null}
          {!assignmentsLoading && !assignmentsError && assignments.length > 0 ? (
            <div className={styles.assignmentGrid}>{assignments.map((assignment) => <AssignmentCard key={assignment.assignmentId} assignment={assignment} starting={startingId === assignment.assignmentId} onStart={startAssignment} />)}</div>
          ) : null}
        </section>
      )}
    </div>
  );
}

function PracticeCard({ item, index, starting, onStart }: { item: StudentReadingCatalogItem; index: number; starting: boolean; onStart: (item: StudentReadingCatalogItem) => void }) {
  const resume = Boolean(item.activeAttemptId);
  return (
    <article className={`${styles.testCard} ${styles[`variant${index % 4}`]}`}>
      <div className={styles.art} aria-hidden="true"><i /><i /><i /><i /><BookOpenText size={54} weight="duotone" /></div>
      <div className={styles.cardTop}>
        <span className={styles.testType}>{item.testType === "FULL_TEST" ? "Full Reading" : `${item.sectionsCount || 1} passage`}</span>
        <span className={resume ? styles.inProgress : styles.ready}><i />{resume ? "Đang làm" : "Sẵn sàng"}</span>
      </div>
      <div className={styles.cardBody}>
        <p className={styles.code}>{item.code}</p><h2>{item.title}</h2>
        <p className={styles.description}>{item.description || "Đề luyện Reading đã được kiểm duyệt và xuất bản."}</p>
        <ul className={styles.tags}>{item.tags.filter((tag) => tag.toUpperCase() !== "READING").slice(0, 3).map((tag) => <li key={tag}>{tag}</li>)}</ul>
      </div>
      <dl className={styles.cardStats}>
        <div><dt>Câu hỏi</dt><dd>{item.totalQuestions}</dd></div><div><dt>Thời gian</dt><dd>{item.durationMinutes} phút</dd></div><div><dt>Lượt đã làm</dt><dd>{item.attemptsCount}</dd></div>
      </dl>
      <div className={styles.cardFooter}>
        <span>{item.lastScore == null ? "Chưa có kết quả" : `Gần nhất ${item.lastScore}/${item.totalQuestions}`}</span>
        <button type="button" disabled={starting} onClick={() => onStart(item)}>
          {starting ? <CircleNotch size={18} className={styles.spin} /> : <Play size={17} weight="fill" />}{starting ? "Đang mở" : resume ? "Tiếp tục" : "Bắt đầu"}<ArrowRight size={16} weight="bold" />
        </button>
      </div>
    </article>
  );
}

function AssignmentCard({ assignment, starting, onStart }: { assignment: StudentReadingAssignment; starting: boolean; onStart: (id: string) => void }) {
  const state = assignmentAvailability(assignment); const resume = Boolean(assignment.activeAttemptExpiresAt);
  return (
    <article className={styles.assignmentCard}>
      <div className={styles.assignmentIcon}><BookOpenText size={23} weight="fill" /></div>
      <div className={styles.assignmentCopy}>
        <div><span>{assignment.courseName}</span><small>{state.label}</small></div><h2>{assignment.title}</h2>
        <dl><div><Clock size={17} /><dt className="sr-only">Thời lượng</dt><dd>{assignment.durationSeconds ? formatDuration(assignment.durationSeconds) : "Theo thời lượng đề"}</dd></div><div><CalendarBlank size={17} /><dt className="sr-only">Hạn làm</dt><dd>{formatDateTime(assignment.closesAt)}</dd></div><div><CheckCircle size={17} /><dt className="sr-only">Lượt làm</dt><dd>{assignment.attemptsUsed}/{assignment.maxAttempts} lượt</dd></div></dl>
      </div>
      <button type="button" disabled={!state.available || starting} onClick={() => onStart(assignment.assignmentId)}>
        {starting ? <CircleNotch size={18} className={styles.spin} /> : <Play size={17} weight="fill" />}{starting ? "Đang mở" : resume ? "Tiếp tục" : "Làm bài"}<ArrowRight size={16} weight="bold" />
      </button>
    </article>
  );
}

function CatalogSkeleton({ compact = false }: { compact?: boolean }) {
  return <div className={compact ? styles.assignmentGrid : styles.catalogGrid} aria-busy="true" aria-label="Đang tải danh sách đề">{Array.from({ length: compact ? 2 : 6 }, (_, index) => <div key={index} className={styles.skeleton} />)}</div>;
}
