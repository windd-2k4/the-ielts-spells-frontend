"use client";

import { useEffect, useState } from "react";
import { fetchStudentPortfolio, type StudentPortfolio as StudentPortfolioData } from "../studentPortalApi";
import styles from "./StudentPortfolio.module.css";

function formatDate(value: string | null) {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Chưa cập nhật" : date.toLocaleString("vi-VN");
}

function statusLabel(status: string | null) {
  return {
    DRAFT: "Bản nháp",
    SUBMITTED: "Đã nộp",
    LATE: "Đã nộp muộn",
    IN_PROGRESS: "Đang làm",
    WAITING_REVIEW: "Chờ giáo viên chấm",
    COMPLETED: "Hoàn tất",
    NEEDS_REVISION: "Cần sửa",
    VERIFIED: "Đã xác nhận",
    REVISION_REQUESTED: "Yêu cầu sửa",
    REJECTED: "Cần nộp lại",
  }[status ?? ""] ?? "Chưa có trạng thái";
}

function skillLabel(skill: string) {
  return skill === "WRITING" ? "Writing" : skill === "SPEAKING" ? "Speaking" : skill;
}

export default function StudentPortfolio({ courseId }: { courseId: string }) {
  const [portfolio, setPortfolio] = useState<StudentPortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    void fetchStudentPortfolio(courseId)
      .then((value) => { if (active) setPortfolio(value); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Không thể tải portfolio khóa học."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [courseId]);

  async function sharePortfolio() {
    if (!portfolio) return;
    const shareText = `${portfolio.courseName} · Portfolio Speaking & Writing\n${portfolio.summary.totalSubmissions} lần nộp · ${portfolio.summary.gradedSubmissions} lần đã có feedback`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Portfolio ${portfolio.courseName}`, text: shareText, url: window.location.href });
        setNotice("Đã mở bảng chia sẻ portfolio.");
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setNotice("Đã sao chép liên kết portfolio.");
      }
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      setNotice("Không thể chia sẻ lúc này. Bạn có thể dùng nút xuất PDF.");
    }
  }

  function printPortfolio() {
    document.body.classList.add("print-student-portfolio");
    const cleanup = () => document.body.classList.remove("print-student-portfolio");
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
  }

  if (loading) return <section className={styles.state}>Đang tổng hợp portfolio của bạn…</section>;
  if (error) return <section className={styles.stateError} role="alert">{error}</section>;
  if (!portfolio) return <section className={styles.state}>Chưa có dữ liệu portfolio cho khóa học này.</section>;

  return <article className={styles.portfolio} id="student-sw-portfolio">
    <header className={styles.portfolioHeader}>
      <div><span className={styles.eyebrow}>Student SW Portfolio</span><h2>{portfolio.courseName}</h2><p>{portfolio.courseCode} · Theo dõi xuyên suốt Speaking & Writing · Cập nhật {formatDate(portfolio.generatedAt)}</p></div>
      <div className={styles.portfolioActions}><button type="button" onClick={printPortfolio}>Xuất PDF / in</button><button type="button" onClick={() => void sharePortfolio()}>Chia sẻ tổng kết</button></div>
    </header>
    {notice ? <p className={styles.notice} role="status">{notice}</p> : null}

    <section className={styles.summaryGrid} aria-label="Tóm tắt portfolio">
      <div><strong>{portfolio.summary.totalAssignments}</strong><span>Assignment trong khóa</span></div>
      <div><strong>{portfolio.summary.completedAssignments}</strong><span>Assignment đã hoàn tất</span></div>
      <div><strong>{portfolio.summary.totalSubmissions}</strong><span>Lần nộp bài</span></div>
      <div><strong>{portfolio.summary.gradedSubmissions}</strong><span>Lần đã có feedback</span></div>
      <div><strong>{portfolio.summary.reflections}</strong><span>Reflection</span></div>
    </section>

    <section className={styles.section} aria-labelledby="criterion-progress-title">
      <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Rubric report</span><h3 id="criterion-progress-title">Tiến bộ theo từng tiêu chí</h3></div><span className={styles.muted}>{portfolio.criterionProgress.length} tiêu chí đã có dữ liệu</span></div>
      {portfolio.criterionProgress.length ? <div className={styles.criteriaGrid}>{portfolio.criterionProgress.map((criterion) => <div className={styles.criterionCard} key={`${criterion.skill}-${criterion.criterion}`}><div className={styles.criterionHeading}><strong>{criterion.label}</strong><span>{skillLabel(criterion.skill)}</span></div><div className={styles.scoreLine}><b>{criterion.averageScore.toFixed(1)}</b><small>trung bình / 9</small><em>Lần gần nhất {criterion.latestScore.toFixed(1)}</em></div><div className={styles.progressTrack}><span style={{ width: `${Math.min(100, Math.max(0, (criterion.averageScore / 9) * 100))}%` }} /></div><small className={styles.muted}>{criterion.gradedCount} lần được chấm</small></div>)}</div> : <p className={styles.empty}>Chưa có rubric được chấm. Các tiêu chí sẽ xuất hiện sau khi giáo viên feedback.</p>}
    </section>

    <section className={styles.section} aria-labelledby="portfolio-timeline-title">
      <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Learning record</span><h3 id="portfolio-timeline-title">Timeline submission · feedback · reflection</h3></div><span className={styles.muted}>{portfolio.timeline.length} bản ghi</span></div>
      {portfolio.timeline.length ? <div className={styles.timeline}>{portfolio.timeline.map((entry) => <details className={styles.timelineEntry} key={entry.submissionId}>
        <summary><span className={styles.timelineMarker} /><div className={styles.timelineTitle}><strong>{entry.assignmentTitle}</strong><small>Session {entry.sessionNo} · {entry.sessionTitle} · Attempt {entry.attemptNo}</small></div><span className={styles.timelineMeta}><b>{entry.score == null ? statusLabel(entry.attemptStatus || entry.submissionStatus) : `${entry.score}/${entry.maxScore ?? "—"}`}</b><small>{formatDate(entry.submittedAt)}</small></span></summary>
        <div className={styles.timelineBody}><div className={styles.entryTags}><span>{skillLabel(entry.skill)}</span><span>{statusLabel(entry.submissionStatus)}</span>{entry.reviewStatus ? <span>{statusLabel(entry.reviewStatus)}</span> : null}{entry.audioSubmitted ? <span>Có audio</span> : null}{entry.late ? <span>Nộp muộn</span> : null}</div>
          {entry.rubric.length ? <section className={styles.entrySection}><h4>Rubric</h4><div className={styles.rubricList}>{entry.rubric.map((criterion) => <div key={`${entry.submissionId}-${criterion.criterion}`}><span>{criterion.label}</span><b>{criterion.score == null ? "—" : criterion.score}</b>{criterion.feedback ? <small>{criterion.feedback}</small> : null}</div>)}</div></section> : null}
          {entry.feedback ? <section className={styles.entrySection}><h4>Feedback giáo viên <small>{formatDate(entry.reviewedAt)}</small></h4><p>{entry.feedback}</p></section> : null}
          {entry.reflection ? <section className={styles.entrySection}><h4>Reflection của học viên</h4><p>{entry.reflection}</p>{entry.reflectionDueAt ? <small>Deadline: {formatDate(entry.reflectionDueAt)}</small> : null}</section> : null}
          {entry.annotations.length ? <section className={styles.entrySection}><h4>Inline comments · {entry.annotations.length}</h4><div className={styles.annotationList}>{entry.annotations.map((annotation) => <div key={annotation.id}><blockquote>“{annotation.quotedText}”</blockquote><p>{annotation.comment}</p>{annotation.suggestion ? <small>Gợi ý: {annotation.suggestion}</small> : null}</div>)}</div></section> : null}
        </div>
      </details>)}</div> : <p className={styles.empty}>Chưa có submission nào trong khóa học. Khi bạn nộp bài, toàn bộ lịch sử sẽ được lưu ở đây.</p>}
    </section>
  </article>;
}
